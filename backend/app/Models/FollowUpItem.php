<?php

namespace App\Models;

use App\Enums\FollowUpStatus;
use App\Enums\Priority;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FollowUpItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'meeting_id',
        'meeting_note_id',
        'highlighted_text',
        'highlight_start',
        'highlight_end',
        'highlight_color',
        'title',
        'description',
        'priority',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'highlight_start' => 'integer',
            'highlight_end' => 'integer',
            'priority' => Priority::class,
            'status' => FollowUpStatus::class,
        ];
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function meetingNote(): BelongsTo
    {
        return $this->belongsTo(MeetingNote::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
