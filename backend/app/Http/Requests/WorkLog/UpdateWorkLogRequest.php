<?php

namespace App\Http\Requests\WorkLog;

use App\Enums\WorkCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        $log = $this->route('work_log');

        return $this->user()->can('update', $log);
    }

    public function rules(): array
    {
        return [
            'log_date' => ['sometimes', 'date', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.description' => ['required', 'string', 'max:500'],
            'items.*.category' => ['required', Rule::enum(WorkCategory::class)],
            'items.*.start_time' => ['required', 'date_format:H:i'],
            'items.*.end_time' => ['required', 'date_format:H:i', 'after:items.*.start_time'],
            'items.*.progress' => ['required', 'integer', 'min:0', 'max:100'],

            // File attachments
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimes:pdf,doc,docx,xls,xlsx,pptx,jpg,jpeg,png', 'max:10240'],

            // Link attachments
            'links' => ['nullable', 'array'],
            'links.*.url' => ['required', 'url', 'max:2048'],
            'links.*.label' => ['nullable', 'string', 'max:255'],

            // IDs of existing attachments to keep (others will be deleted)
            'existing_attachment_ids' => ['nullable', 'array'],
            'existing_attachment_ids.*' => ['integer'],
        ];
    }
}
