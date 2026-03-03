<?php

namespace App\Http\Requests\Meeting;

use App\Enums\MeetingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create-meeting');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'meeting_date' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(MeetingStatus::class)],
            'participants' => ['nullable', 'array'],
            'participants.*.user_id' => ['required_with:participants', 'exists:users,id'],
            'participants.*.role' => ['required_with:participants', 'in:host,noter,participant'],

            'external_participants' => ['nullable', 'array'],
            'external_participants.*.id' => ['nullable', 'exists:external_contacts,id'],
            'external_participants.*.name' => ['required_without:external_participants.*.id', 'string', 'max:255'],
            'external_participants.*.email' => ['nullable', 'email', 'max:255'],
            'external_participants.*.phone' => ['nullable', 'string', 'max:20'],
            'external_participants.*.organization' => ['nullable', 'string', 'max:255'],
            'external_participants.*.position' => ['nullable', 'string', 'max:255'],
            'external_participants.*.role' => ['nullable', 'in:host,noter,participant'],

            'attachment' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }
}
