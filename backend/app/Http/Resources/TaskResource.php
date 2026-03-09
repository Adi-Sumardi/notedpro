<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'priority' => $this->priority,
            'priority_label' => $this->priority->label(),
            'deadline' => $this->deadline,
            'is_overdue' => $this->isOverdue(),
            'assigned_to' => new UserResource($this->whenLoaded('assignee')),
            'assigned_by' => new UserResource($this->whenLoaded('assigner')),
            'follow_up_item' => new FollowUpResource($this->whenLoaded('followUpItem')),
            'meeting' => $this->when(
                $this->relationLoaded('followUpItem') && $this->followUpItem?->relationLoaded('meeting'),
                fn () => new MeetingResource($this->followUpItem->meeting)
            ),
            'comments' => TaskCommentResource::collection($this->whenLoaded('comments')),
            'activities' => TaskActivityResource::collection($this->whenLoaded('activities')),
            'attachments' => TaskAttachmentResource::collection($this->whenLoaded('attachments')),
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
        ];
    }
}
