<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DailyWorkLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'log_date' => $this->log_date->format('Y-m-d'),
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'notes' => $this->notes,
            'submitted_at' => $this->submitted_at,
            'reviewed_at' => $this->reviewed_at,
            'review_comment' => $this->review_comment,
            'user' => new UserResource($this->whenLoaded('user')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'items' => WorkLogItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
