<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MeetingNoteResource;
use App\Models\Meeting;
use App\Models\MeetingNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingNoteController extends Controller
{
    public function index(Meeting $meeting): JsonResponse
    {
        $notes = $meeting->notes()
            ->with(['creator', 'followUpItems.creator', 'followUpItems.tasks.assignee'])
            ->orderByDesc('version')
            ->get();

        return response()->json([
            'success' => true,
            'data' => MeetingNoteResource::collection($notes),
        ]);
    }

    public function store(Request $request, Meeting $meeting): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['nullable', 'array'],
            'content_html' => ['nullable', 'string'],
        ]);

        $latestVersion = $meeting->notes()->max('version') ?? 0;

        $note = MeetingNote::create([
            'meeting_id' => $meeting->id,
            'content' => $validated['content'] ?? null,
            'content_html' => $validated['content_html'] ?? null,
            'version' => $latestVersion + 1,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => new MeetingNoteResource($note->load('creator')),
            'message' => 'Catatan meeting berhasil disimpan.',
        ], 201);
    }

    public function update(Request $request, Meeting $meeting, MeetingNote $note): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['nullable', 'array'],
            'content_html' => ['nullable', 'string'],
        ]);

        $note->update([
            'content' => $validated['content'] ?? $note->content,
            'content_html' => $validated['content_html'] ?? $note->content_html,
            'version' => $note->version + 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => new MeetingNoteResource($note->load(['creator', 'followUpItems'])),
            'message' => 'Catatan meeting berhasil diperbarui.',
        ]);
    }
}
