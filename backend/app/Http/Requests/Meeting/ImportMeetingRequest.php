<?php

namespace App\Http\Requests\Meeting;

use App\Enums\MeetingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create-meeting') && $this->user()->can('create-notes');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'meeting_date' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'location_type' => ['nullable', 'in:offline,online'],
            'meeting_link' => ['nullable', 'required_if:location_type,online', 'url', 'max:500'],
            'meeting_passcode' => ['nullable', 'string', 'max:255'],
            'organizer' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(MeetingStatus::class)],

            'content' => ['nullable', 'array'],
            'content_html' => ['required', 'string'],
        ];
    }
}
