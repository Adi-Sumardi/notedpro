<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class WorkLogAttachment extends Model
{
    protected $fillable = [
        'daily_work_log_id',
        'type',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
        'url',
        'label',
    ];

    public function dailyWorkLog(): BelongsTo
    {
        return $this->belongsTo(DailyWorkLog::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        if ($this->type !== 'file' || !$this->file_path) {
            return null;
        }

        return Storage::disk('public')->url($this->file_path);
    }
}
