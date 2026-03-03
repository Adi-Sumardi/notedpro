<?php

namespace App\Http\Requests\WorkLog;

use Illuminate\Foundation\Http\FormRequest;

class ReviewWorkLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        $log = $this->route('work_log');

        return $this->user()->can('review', $log);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:approved,rejected'],
            'review_comment' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
