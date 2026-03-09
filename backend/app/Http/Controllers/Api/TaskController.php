<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskController extends Controller
{
    public function __construct(private TaskService $taskService) {}

    public function index(Request $request): JsonResponse
    {
        $tasks = $this->taskService->list(
            $request->query(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($tasks),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
                'per_page' => $tasks->perPage(),
                'total' => $tasks->total(),
            ],
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->taskService->create(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
            'message' => "Task ditugaskan ke {$task->assignee->name}.",
        ], 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $task->load([
            'assignee',
            'assigner',
            'followUpItem.meeting',
            'comments.user',
            'comments.attachments',
            'activities.user',
            'attachments' => fn ($q) => $q->whereNull('task_comment_id'),
        ]);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
        ]);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'assigned_to' => ['sometimes', 'exists:users,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'deadline' => ['sometimes', 'date'],
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task->fresh(['assignee', 'assigner', 'followUpItem.meeting'])),
            'message' => 'Task berhasil diperbarui.',
        ]);
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): JsonResponse
    {
        $this->authorize('updateStatus', $task);

        $task = $this->taskService->updateStatus(
            $task,
            $request->validated()['status'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
            'message' => "Status task diperbarui menjadi {$task->status->label()}.",
        ]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        // Delete attachment files
        foreach ($task->attachments as $att) {
            if ($att->file_path) {
                Storage::disk('public')->delete($att->file_path);
            }
        }

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task berhasil dihapus.',
        ]);
    }

    public function uploadAttachments(Request $request, Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $request->validate([
            'attachments' => ['required', 'array', 'min:1'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $files = $request->file('attachments', []);
        $created = [];

        foreach ($files as $file) {
            $path = $file->store('tasks/attachments', 'public');
            $created[] = TaskAttachment::create([
                'task_id' => $task->id,
                'task_comment_id' => null,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $created,
            'message' => count($created) . ' file berhasil diupload.',
        ], 201);
    }

    public function deleteAttachment(TaskAttachment $taskAttachment): JsonResponse
    {
        $task = $taskAttachment->task;
        $this->authorize('view', $task);

        if ($taskAttachment->file_path) {
            Storage::disk('public')->delete($taskAttachment->file_path);
        }

        $taskAttachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lampiran berhasil dihapus.',
        ]);
    }

    public function downloadAttachment(TaskAttachment $taskAttachment): StreamedResponse
    {
        $path = $taskAttachment->file_path;
        $name = $taskAttachment->original_name ?? basename($path);
        $mime = $taskAttachment->mime_type ?? 'application/octet-stream';

        return response()->streamDownload(function () use ($path) {
            echo Storage::disk('public')->get($path);
        }, $name, [
            'Content-Type' => $mime,
        ]);
    }
}
