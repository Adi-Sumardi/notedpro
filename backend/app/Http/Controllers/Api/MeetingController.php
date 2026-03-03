<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meeting\StoreMeetingRequest;
use App\Http\Requests\Meeting\UpdateMeetingRequest;
use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use App\Services\MeetingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MeetingController extends Controller
{
    public function __construct(private MeetingService $meetingService) {}

    public function index(Request $request): JsonResponse
    {
        $meetings = $this->meetingService->list(
            $request->query(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => MeetingResource::collection($meetings),
            'meta' => [
                'current_page' => $meetings->currentPage(),
                'last_page' => $meetings->lastPage(),
                'per_page' => $meetings->perPage(),
                'total' => $meetings->total(),
            ],
        ]);
    }

    public function store(StoreMeetingRequest $request): JsonResponse
    {
        $meeting = $this->meetingService->create(
            $request->validated(),
            $request->user(),
            $request->file('attachment')
        );

        return response()->json([
            'success' => true,
            'data' => new MeetingResource($meeting),
            'message' => 'Meeting berhasil dibuat.',
        ], 201);
    }

    public function show(Meeting $meeting): JsonResponse
    {
        $this->authorize('view', $meeting);

        $meeting->load([
            'creator',
            'participants',
            'externalParticipants',
            'latestNote.creator',
            'latestNote.followUpItems.creator',
            'latestNote.followUpItems.tasks.assignee',
        ]);
        $meeting->loadCount(['participants', 'externalParticipants', 'followUpItems']);

        return response()->json([
            'success' => true,
            'data' => new MeetingResource($meeting),
        ]);
    }

    public function update(UpdateMeetingRequest $request, Meeting $meeting): JsonResponse
    {
        $this->authorize('update', $meeting);

        $meeting = $this->meetingService->update($meeting, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new MeetingResource($meeting),
            'message' => 'Meeting berhasil diperbarui.',
        ]);
    }

    public function destroy(Meeting $meeting): JsonResponse
    {
        $this->authorize('delete', $meeting);

        $meeting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meeting berhasil dihapus.',
        ]);
    }

    public function downloadAttachment(Meeting $meeting): StreamedResponse|JsonResponse
    {
        $this->authorize('view', $meeting);

        if (! $meeting->attachment_path) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting ini tidak memiliki lampiran.',
            ], 404);
        }

        return Storage::disk('public')->download(
            $meeting->attachment_path,
            $meeting->attachment_original_name
        );
    }

    public function updateStatus(Request $request, Meeting $meeting): JsonResponse
    {
        $this->authorize('update', $meeting);

        $request->validate([
            'status' => ['required', 'in:draft,in_progress,completed'],
        ]);

        $meeting->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'data' => new MeetingResource($meeting->fresh(['creator', 'participants'])),
            'message' => 'Status meeting berhasil diperbarui.',
        ]);
    }
}
