<?php

namespace App\Services;

use App\Models\Meeting;

class IcsGenerator
{
    public static function generate(Meeting $meeting): string
    {
        $uid = "meeting-{$meeting->id}@notedpro.com";
        $start = $meeting->meeting_date->format('Ymd\THis');
        $end = $meeting->meeting_date->copy()->addHours(2)->format('Ymd\THis');
        $now = now()->format('Ymd\THis');

        $title = self::escapeIcs($meeting->title);
        $description = self::escapeIcs($meeting->description ?? '');
        $location = self::escapeIcs($meeting->location ?? '');

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NotedPro//Meeting//ID',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            "UID:{$uid}",
            "DTSTAMP:{$now}",
            "DTSTART:{$start}",
            "DTEND:{$end}",
            "SUMMARY:{$title}",
            "DESCRIPTION:{$description}",
            "LOCATION:{$location}",
            "ORGANIZER;CN={$meeting->creator->name}:mailto:{$meeting->creator->email}",
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR',
        ];

        return implode("\r\n", $lines);
    }

    private static function escapeIcs(string $text): string
    {
        return str_replace(
            ["\n", "\r", ',', ';', '\\'],
            ['\\n', '', '\\,', '\\;', '\\\\'],
            $text
        );
    }
}
