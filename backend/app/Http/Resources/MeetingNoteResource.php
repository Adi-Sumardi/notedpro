<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'meeting_id' => $this->meeting_id,
            'content' => $this->content,
            'content_html' => $this->content_html,
            'version' => $this->version,
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'follow_up_items' => FollowUpResource::collection($this->whenLoaded('followUpItems')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
