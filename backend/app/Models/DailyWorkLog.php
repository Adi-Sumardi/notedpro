<?php

namespace App\Models;

use App\Enums\WorkLogStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DailyWorkLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'log_date',
        'status',
        'notes',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'review_comment',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkLogStatus::class,
            'log_date' => 'date',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(WorkLogItem::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(WorkLogAttachment::class);
    }

    public function isDraft(): bool
    {
        return $this->status === WorkLogStatus::Draft;
    }

    public function isSubmitted(): bool
    {
        return $this->status === WorkLogStatus::Submitted;
    }
}
