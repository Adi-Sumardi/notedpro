<?php

namespace App\Models;

use App\Enums\WorkCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkLogItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'daily_work_log_id',
        'description',
        'category',
        'start_time',
        'end_time',
        'progress',
    ];

    protected function casts(): array
    {
        return [
            'category' => WorkCategory::class,
            'progress' => 'integer',
        ];
    }

    public function dailyWorkLog(): BelongsTo
    {
        return $this->belongsTo(DailyWorkLog::class);
    }
}
