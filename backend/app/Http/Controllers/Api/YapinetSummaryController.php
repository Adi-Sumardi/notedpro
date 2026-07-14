<?php

namespace App\Http\Controllers\Api;

use App\Enums\FollowUpStatus;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\FollowUpItem;
use App\Models\Meeting;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class YapinetSummaryController extends Controller
{
    /**
     * Number of overdue tasks at/above which the top-level status escalates
     * from "warning" to "critical". Tunable without touching the logic below.
     */
    private const CRITICAL_OVERDUE_THRESHOLD = 5;

    /**
     * Summary + detail feed polled by the external Yapinet portal.
     *
     * NOTE: There is no real "unit"/department FK in this app (only a free-text
     * users.department column), so this endpoint intentionally does not filter
     * by unit/department — it reports Simonik-wide figures only.
     */
    public function summary(Request $request): JsonResponse
    {
        $now = now();

        $totalMeetings = Meeting::count();

        $openFollowUpsCount = FollowUpItem::where('status', '!=', FollowUpStatus::Done)->count();

        $overdueTasksCount = Task::where('status', '!=', TaskStatus::Done)
            ->whereDate('deadline', '<', $now->toDateString())
            ->count();

        $status = 'ok';
        if ($overdueTasksCount >= self::CRITICAL_OVERDUE_THRESHOLD) {
            $status = 'critical';
        } elseif ($overdueTasksCount > 0) {
            $status = 'warning';
        }

        if ($overdueTasksCount > 0) {
            $headline = "{$overdueTasksCount} tugas overdue perlu perhatian";
        } elseif ($openFollowUpsCount > 0) {
            $headline = "{$openFollowUpsCount} follow up masih berjalan";
        } else {
            $headline = 'Semua follow up dan tugas selesai';
        }

        $meetings = Meeting::where('meeting_date', '<=', $now)
            ->orderByDesc('meeting_date')
            ->limit(10)
            ->get()
            ->map(fn (Meeting $meeting) => [
                'tanggal' => $meeting->meeting_date->format('Y-m-d'),
                'tempat' => $meeting->location,
                'agenda' => $meeting->title,
            ])
            ->values();

        $followUps = FollowUpItem::with(['meeting', 'creator', 'tasks.assignee'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (FollowUpItem $followUp) {
                // No direct assignee column on FollowUpItem itself: prefer the
                // assignee of its first related Task, falling back to whoever
                // created the follow-up item.
                $assignee = $followUp->tasks->first()?->assignee ?? $followUp->creator;

                return [
                    'tanggal_meeting' => $followUp->meeting?->meeting_date?->format('Y-m-d'),
                    'tindak_lanjut' => $followUp->title,
                    'penanggung_jawab' => $assignee?->name,
                    'status' => match ($followUp->status) {
                        FollowUpStatus::Done => 'Selesai',
                        FollowUpStatus::Assigned => 'Proses',
                        FollowUpStatus::Open => 'Belum Mulai',
                    },
                ];
            })
            ->values();

        $jadwalLain = Meeting::where('meeting_date', '>', $now)
            ->orderBy('meeting_date')
            ->limit(10)
            ->get()
            ->map(fn (Meeting $meeting) => [
                'tanggal' => $meeting->meeting_date->format('Y-m-d'),
                'waktu' => $meeting->meeting_date->format('H:i'),
                'tempat' => $meeting->location,
                'agenda' => $meeting->title,
            ])
            ->values();

        return response()->json([
            'status' => $status,
            'headline' => $headline,
            'metrics' => [
                ['label' => 'Total Meeting', 'value' => $totalMeetings],
                ['label' => 'Follow Up Terbuka', 'value' => $openFollowUpsCount],
                ['label' => 'Tugas Overdue', 'value' => $overdueTasksCount],
            ],
            'details' => [
                'meetings' => $meetings,
                'follow_ups' => $followUps,
                'jadwal_lain' => $jadwalLain,
            ],
            'updated_at' => $now->clone()->setTimezone('Asia/Jakarta')->toIso8601String(),
            'detail_path' => null,
        ]);
    }
}
