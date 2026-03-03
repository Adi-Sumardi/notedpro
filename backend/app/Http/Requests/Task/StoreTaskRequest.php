<?php

namespace App\Http\Requests\Task;

use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('assign-task');
    }

    public function rules(): array
    {
        return [
            'follow_up_item_id' => ['required', 'exists:follow_up_items,id'],
            'assigned_to' => ['required', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', Rule::enum(Priority::class)],
            'deadline' => ['required', 'date', 'after_or_equal:today'],
        ];
    }
}
