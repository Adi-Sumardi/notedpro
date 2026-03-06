<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MeetingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'meeting_date' => $this->meeting_date,
            'location' => $this->location,
            'organizer' => $this->organizer,
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'participants' => UserResource::collection($this->whenLoaded('participants')),
            'external_participants' => $this->whenLoaded('externalParticipants', fn () =>
                $this->externalParticipants->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'organization' => $c->organization,
                    'position' => $c->position,
                    'role' => $c->pivot->role ?? 'participant',
                ])
            ),
            'participants_count' => $this->whenCounted('participants'),
            'external_participants_count' => $this->whenCounted('externalParticipants'),
            'follow_ups_count' => $this->whenCounted('followUpItems'),
            'latest_note' => new MeetingNoteResource($this->whenLoaded('latestNote')),
            'attachment_url' => $this->attachment_path
                ? Storage::disk('public')->url($this->attachment_path)
                : null,
            'attachment_name' => $this->attachment_original_name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
