<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeetingNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'content',
        'content_html',
        'version',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'version' => 'integer',
        ];
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function followUpItems(): HasMany
    {
        return $this->hasMany(FollowUpItem::class);
    }
}
