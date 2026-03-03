<?php

namespace App\Enums;

enum WorkCategory: string
{
    case Meeting = 'meeting';
    case Development = 'development';
    case Administrative = 'administrative';
    case Research = 'research';
    case Communication = 'communication';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Meeting => 'Rapat/Meeting',
            self::Development => 'Pengembangan',
            self::Administrative => 'Administrasi',
            self::Research => 'Riset/Penelitian',
            self::Communication => 'Komunikasi/Koordinasi',
            self::Other => 'Lainnya',
        };
    }
}
