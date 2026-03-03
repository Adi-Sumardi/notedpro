<?php

namespace App\Enums;

enum FollowUpStatus: string
{
    case Open = 'open';
    case Assigned = 'assigned';
    case Done = 'done';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::Assigned => 'Assigned',
            self::Done => 'Done',
        };
    }
}
