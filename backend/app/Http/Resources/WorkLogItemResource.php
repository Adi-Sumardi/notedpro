<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkLogItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'category' => $this->category,
            'category_label' => $this->category->label(),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'progress' => $this->progress,
        ];
    }
}
