<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class MeetingExternalParticipant extends Pivot
{
    protected $table = 'meeting_external_participants';

    public $incrementing = true;

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function externalContact(): BelongsTo
    {
        return $this->belongsTo(ExternalContact::class);
    }
}
