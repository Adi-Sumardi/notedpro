<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Meeting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingParticipantController extends Controller
{
    public function index(Meeting $meeting): JsonResponse
    {
        $participants = $meeting->participants()->get();

        return response()->json([
            'success' => true,
            'data' => $participants->map(fn ($p) => [
                'user' => new UserResource($p),
                'role' => $p->pivot->role,
            ]),
        ]);
    }

    public function store(Request $request, Meeting $meeting): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'in:host,noter,participant'],
        ]);

        if ($meeting->participants()->where('user_id', $validated['user_id'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'User sudah menjadi peserta meeting ini.',
            ], 422);
        }

        $meeting->participants()->attach($validated['user_id'], [
            'role' => $validated['role'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Peserta berhasil ditambahkan.',
        ], 201);
    }

    public function destroy(Meeting $meeting, int $userId): JsonResponse
    {
        $meeting->participants()->detach($userId);

        return response()->json([
            'success' => true,
            'message' => 'Peserta berhasil dihapus.',
        ]);
    }
}
