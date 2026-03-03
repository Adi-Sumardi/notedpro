<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FollowUpResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'meeting_id' => $this->meeting_id,
            'meeting_note_id' => $this->meeting_note_id,
            'highlighted_text' => $this->highlighted_text,
            'highlight_start' => $this->highlight_start,
            'highlight_end' => $this->highlight_end,
            'highlight_color' => $this->highlight_color,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'priority_label' => $this->priority->label(),
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'meeting' => new MeetingResource($this->whenLoaded('meeting')),
            'created_at' => $this->created_at,
        ];
    }
}
