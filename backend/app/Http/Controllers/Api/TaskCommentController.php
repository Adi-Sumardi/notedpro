<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskCommentResource;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function index(Task $task): JsonResponse
    {
        $comments = $task->comments()
            ->with(['user', 'attachments'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => TaskCommentResource::collection($comments),
        ]);
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Handle file attachments
        $files = $request->file('attachments', []);
        foreach ($files as $file) {
            TaskAttachment::create([
                'task_id' => $task->id,
                'task_comment_id' => $comment->id,
                'file_path' => $file->store('tasks/comments', 'public'),
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => new TaskCommentResource($comment->load(['user', 'attachments'])),
            'message' => 'Komentar berhasil ditambahkan.',
        ], 201);
    }
}
