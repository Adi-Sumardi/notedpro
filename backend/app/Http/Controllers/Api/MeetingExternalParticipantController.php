<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExternalContact;
use App\Models\Meeting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingExternalParticipantController extends Controller
{
    public function store(Request $request, Meeting $meeting): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'organization' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'in:host,noter,participant'],
            'external_contact_id' => ['nullable', 'exists:external_contacts,id'],
        ]);

        // Use existing contact or create new one
        if (!empty($validated['external_contact_id'])) {
            $contact = ExternalContact::findOrFail($validated['external_contact_id']);
        } else {
            $contact = ExternalContact::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'organization' => $validated['organization'] ?? null,
                'position' => $validated['position'] ?? null,
            ]);
        }

        if ($meeting->externalParticipants()->where('external_contact_id', $contact->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Peserta eksternal sudah terdaftar di meeting ini.',
            ], 422);
        }

        $meeting->externalParticipants()->attach($contact->id, [
            'role' => $validated['role'] ?? 'participant',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Peserta eksternal berhasil ditambahkan.',
            'data' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'phone' => $contact->phone,
                'organization' => $contact->organization,
                'position' => $contact->position,
                'role' => $validated['role'] ?? 'participant',
            ],
        ], 201);
    }

    public function update(Request $request, Meeting $meeting, int $contactId): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'organization' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'in:host,noter,participant'],
        ]);

        $contact = ExternalContact::findOrFail($contactId);
        $contact->update([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'organization' => $validated['organization'] ?? null,
            'position' => $validated['position'] ?? null,
        ]);

        if (isset($validated['role'])) {
            $meeting->externalParticipants()->updateExistingPivot($contactId, [
                'role' => $validated['role'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data peserta eksternal berhasil diperbarui.',
        ]);
    }

    public function destroy(Meeting $meeting, int $contactId): JsonResponse
    {
        $meeting->externalParticipants()->detach($contactId);

        return response()->json([
            'success' => true,
            'message' => 'Peserta eksternal berhasil dihapus dari meeting.',
        ]);
    }
}
