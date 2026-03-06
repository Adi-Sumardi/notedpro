<?php

namespace App\Models;

use App\Enums\MeetingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Meeting extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'meeting_date',
        'location',
        'organizer',
        'created_by',
        'status',
        'attachment_path',
        'attachment_original_name',
    ];

    protected function casts(): array
    {
        return [
            'meeting_date' => 'datetime',
            'status' => MeetingStatus::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'meeting_participants')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function meetingParticipants(): HasMany
    {
        return $this->hasMany(MeetingParticipant::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(MeetingNote::class);
    }

    public function latestNote(): HasOne
    {
        return $this->hasOne(MeetingNote::class)->latestOfMany();
    }

    public function followUpItems(): HasMany
    {
        return $this->hasMany(FollowUpItem::class);
    }

    public function externalParticipants(): BelongsToMany
    {
        return $this->belongsToMany(ExternalContact::class, 'meeting_external_participants')
            ->withPivot('role')
            ->withTimestamps();
    }
}
