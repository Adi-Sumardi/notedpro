<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FollowUp\StoreFollowUpRequest;
use App\Http\Resources\FollowUpResource;
use App\Models\FollowUpItem;
use App\Models\Meeting;
use App\Services\FollowUpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowUpController extends Controller
{
    public function __construct(private FollowUpService $followUpService) {}

    public function index(Meeting $meeting): JsonResponse
    {
        $items = $this->followUpService->listForMeeting($meeting);

        return response()->json([
            'success' => true,
            'data' => FollowUpResource::collection($items),
        ]);
    }

    public function store(StoreFollowUpRequest $request, Meeting $meeting): JsonResponse
    {
        $followUp = $this->followUpService->create(
            $meeting,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new FollowUpResource($followUp->load(['creator', 'tasks.assignee'])),
            'message' => 'Follow-up item berhasil dibuat.',
        ], 201);
    }

    public function update(Request $request, FollowUpItem $followUp): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'highlight_color' => ['nullable', 'string', 'max:20'],
        ]);

        $followUp = $this->followUpService->update($followUp, $validated);

        return response()->json([
            'success' => true,
            'data' => new FollowUpResource($followUp),
            'message' => 'Follow-up item berhasil diperbarui.',
        ]);
    }

    public function destroy(FollowUpItem $followUp): JsonResponse
    {
        $followUp->delete();

        return response()->json([
            'success' => true,
            'message' => 'Follow-up item berhasil dihapus.',
        ]);
    }
}
