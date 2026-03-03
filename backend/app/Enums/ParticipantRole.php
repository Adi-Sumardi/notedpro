<?php

namespace App\Enums;

enum ParticipantRole: string
{
    case Host = 'host';
    case Noter = 'noter';
    case Participant = 'participant';

    public function label(): string
    {
        return match ($this) {
            self::Host => 'Host',
            self::Noter => 'Noter',
            self::Participant => 'Participant',
        };
    }
}
