<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ExternalContact extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'organization',
        'position',
    ];

    public function meetings(): BelongsToMany
    {
        return $this->belongsToMany(Meeting::class, 'meeting_external_participants')
            ->withPivot('role')
            ->withTimestamps();
    }
}
