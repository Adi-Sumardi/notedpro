<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExternalContact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExternalContactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ExternalContact::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('organization', 'like', "%{$search}%");
            });
        }

        $contacts = $query->orderBy('name')->get();

        return response()->json(['data' => $contacts]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'organization' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
        ]);

        $contact = ExternalContact::create($validated);

        return response()->json(['data' => $contact], 201);
    }

    public function update(Request $request, ExternalContact $externalContact): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'organization' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
        ]);

        $externalContact->update($validated);

        return response()->json(['data' => $externalContact]);
    }

    public function destroy(ExternalContact $externalContact): JsonResponse
    {
        $externalContact->delete();

        return response()->json(null, 204);
    }
}
