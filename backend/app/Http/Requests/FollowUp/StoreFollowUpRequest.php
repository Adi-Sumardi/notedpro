<?php

namespace App\Http\Requests\FollowUp;

use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFollowUpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create-followup');
    }

    public function rules(): array
    {
        return [
            'meeting_note_id' => ['required', 'exists:meeting_notes,id'],
            'highlighted_text' => ['required', 'string'],
            'highlight_start' => ['nullable', 'integer', 'min:0'],
            'highlight_end' => ['nullable', 'integer', 'min:0'],
            'highlight_color' => ['nullable', 'string', 'max:20'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', Rule::enum(Priority::class)],

            // Optional: assign to employees at creation time
            'assignees' => ['nullable', 'array'],
            'assignees.*.user_id' => ['required_with:assignees', 'exists:users,id'],
            'assignees.*.deadline' => ['required_with:assignees', 'date', 'after_or_equal:today'],
        ];
    }
}
