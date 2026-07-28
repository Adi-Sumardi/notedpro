<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingNoteImageController extends Controller
{
    /**
     * Store an image referenced by an imported note (e.g. images bundled
     * alongside a Notion markdown export) and return its public URL so the
     * caller can rewrite the note's content_html to point at it.
     */
    public function store(Request $request, Meeting $meeting): JsonResponse
    {
        $this->authorize('view', $meeting);

        $request->validate([
            'image' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $path = $request->file('image')->store("notes/images/{$meeting->id}", 'public');

        return response()->json([
            'success' => true,
            'data' => [
                'url' => url('storage/'.$path),
            ],
        ], 201);
    }
}
