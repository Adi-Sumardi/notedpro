<?php

namespace App\Http\Controllers\Api;

use App\Enums\FollowUpStatus;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\FollowUpItem;
use App\Models\Meeting;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * Ringkasan untuk portal Yapinet (Simonik) — kontrak v1.1
 * (yapinet/rules/detail-pages.md). Dipanggil server Yapinet lewat middleware
 * `yapinet.auth`. Kondisi saat ini (tugas lewat tenggat, tindak lanjut
 * terbuka, jadwal) selalu tampil; statistik periode punya varian
 * `when: {periode}` (30 / 90 hari).
 */
class YapinetSummaryController extends Controller
{
    /** Jumlah tugas lewat tenggat yang membuat status menjadi Kritis. */
    private const CRITICAL_OVERDUE_THRESHOLD = 5;

    private const PERIODS = ['30' => '30 hari terakhir', '90' => '90 hari terakhir'];

    public function summary(): JsonResponse
    {
        $now = now();

        $overdue = Task::with(['assignee', 'followUpItem.meeting'])
            ->where('status', '!=', TaskStatus::Done)
            ->whereNotNull('deadline')
            ->whereDate('deadline', '<', $now->toDateString())
            ->orderBy('deadline')
            ->get();

        $openFollowUps = FollowUpItem::withCount('tasks')->where('status', '!=', FollowUpStatus::Done)->get();
        $withoutPic = $openFollowUps->where('tasks_count', 0);
        $upcoming = Meeting::where('meeting_date', '>', $now)->orderBy('meeting_date')->limit(6)->get();
        $thisWeek = $upcoming->filter(fn (Meeting $m) => $m->meeting_date->lte($now->copy()->endOfWeek()));

        $status = match (true) {
            $overdue->count() >= self::CRITICAL_OVERDUE_THRESHOLD => 'critical',
            $overdue->isNotEmpty() => 'warning',
            default => 'ok',
        };

        $metrics = [
            [
                'label' => 'Tindak lanjut terbuka',
                'value' => $openFollowUps->count(),
                'format' => 'number',
                'hint' => 'berjalan '.$openFollowUps->where('status', FollowUpStatus::Assigned)->count()
                    .' · belum mulai '.$openFollowUps->where('status', FollowUpStatus::Open)->count(),
            ],
            array_filter([
                'label' => 'Tugas lewat tenggat',
                'value' => $overdue->count(),
                'format' => 'number',
                'hint' => $overdue->isNotEmpty() ? 'terlama '.$this->daysLate($overdue->first()).' hari' : 'semua tugas sesuai jadwal',
                'trend' => $overdue->isNotEmpty() ? ['text' => 'perlu ditindaklanjuti', 'tone' => $status === 'critical' ? 'critical' : 'warning'] : null,
            ], fn ($v) => $v !== null),
        ];
        $sections = [$this->overdueList($overdue), $this->upcomingList($upcoming)];

        foreach (self::PERIODS as $days => $label) {
            $when = ['periode' => (string) $days];
            $since = $now->copy()->subDays((int) $days);

            $meetings = Meeting::withCount(['followUpItems', 'notes'])
                ->whereBetween('meeting_date', [$since, $now])
                ->orderByDesc('meeting_date')
                ->get();

            $dueTasks = Task::with('assignee')
                ->whereNotNull('deadline')
                ->whereBetween('deadline', [$since, $now])
                ->get();
            $onTime = $dueTasks->filter(fn (Task $t) => $t->status === TaskStatus::Done
                && $t->completed_at && $t->completed_at->lte($t->deadline->copy()->endOfDay()));
            $ratio = $dueTasks->isNotEmpty() ? $onTime->count() / $dueTasks->count() : null;

            $metrics[] = [
                'label' => "Rapat {$days} hari",
                'value' => $meetings->count(),
                'format' => 'number',
                'hint' => 'notulensi lengkap '.$meetings->where('notes_count', '>', 0)->count(),
                'when' => $when,
            ];
            $metrics[] = array_filter([
                'label' => 'Selesai tepat waktu',
                'value' => $ratio ?? '—',
                'format' => $ratio !== null ? 'percent' : 'text',
                'progress' => $ratio,
                'hint' => "{$onTime->count()} dari {$dueTasks->count()} tugas jatuh tempo",
                'when' => $when,
            ], fn ($v) => $v !== null);

            $sections[] = $this->departmentProgress($dueTasks) + ['when' => $when];
            $sections[] = $this->meetingTable($meetings) + ['when' => $when];
        }

        return response()->json([
            'contract_version' => 2,
            'status' => $status,
            'headline' => match (true) {
                $overdue->isNotEmpty() => "{$overdue->count()} tugas lewat tenggat perlu perhatian",
                $openFollowUps->isNotEmpty() => "{$openFollowUps->count()} tindak lanjut masih berjalan",
                default => 'Semua tindak lanjut dan tugas selesai',
            },
            'updated_at' => $now->clone()->setTimezone('Asia/Jakarta')->toIso8601String(),
            'filters' => [[
                'key' => 'periode',
                'label' => 'Periode',
                'default' => '30',
                'options' => collect(self::PERIODS)->map(fn ($label, $days) => ['value' => (string) $days, 'label' => $label])->values(),
            ]],
            'attention' => $this->attention($overdue, $withoutPic->count(), $thisWeek, $status),
            'metrics' => $metrics,
            'sections' => $sections,
        ]);
    }

    private function attention($overdue, int $withoutPic, $thisWeek, string $status): array
    {
        $items = [];

        if ($overdue->isNotEmpty()) {
            $oldest = $overdue->first();
            $items[] = [
                'tone' => $status === 'critical' ? 'critical' : 'warning',
                'title' => "{$overdue->count()} tugas melewati tenggat",
                'description' => 'Terlama '.$this->daysLate($oldest).' hari'
                    .($oldest->followUpItem?->meeting ? ' · dari '.$oldest->followUpItem->meeting->title : ''),
                'link' => '/tasks',
                'link_label' => 'Lihat tugas',
            ];
        }

        if ($withoutPic > 0) {
            $items[] = [
                'tone' => 'warning',
                'title' => "{$withoutPic} tindak lanjut belum punya penanggung jawab",
                'description' => 'Belum ada tugas yang dibuat dari tindak lanjut ini.',
                'link' => '/meetings',
                'link_label' => 'Tetapkan PIC',
            ];
        }

        if ($thisWeek->isNotEmpty()) {
            $next = $thisWeek->first();
            $items[] = [
                'tone' => 'info',
                'title' => "{$thisWeek->count()} rapat terjadwal minggu ini",
                'description' => 'Terdekat: '.$next->title.', '.$next->meeting_date->locale('id')->translatedFormat('l H.i'),
                'link' => "/meetings/{$next->id}",
                'link_label' => 'Lihat jadwal',
            ];
        }

        return $items;
    }

    private function overdueList($overdue): array
    {
        return [
            'type' => 'list',
            'title' => "Tugas lewat tenggat ({$overdue->count()})",
            'items' => $overdue->take(8)->map(function (Task $task) {
                $late = $this->daysLate($task);
                $pic = $task->assignee
                    ? $task->assignee->name.($task->assignee->department ? " ({$task->assignee->department})" : '')
                    : 'belum ditetapkan';

                return [
                    'title' => $task->title,
                    'subtitle' => 'PIC: '.$pic.($task->followUpItem?->meeting ? ' · '.$task->followUpItem->meeting->title : ''),
                    'badge' => ['text' => "{$late} hari", 'tone' => $late > 14 ? 'critical' : 'warning'],
                    'link' => "/tasks/{$task->id}",
                ];
            })->values(),
        ];
    }

    private function upcomingList($upcoming): array
    {
        return [
            'type' => 'list',
            'title' => 'Jadwal rapat',
            'items' => $upcoming->map(fn (Meeting $m) => [
                'title' => $m->title,
                'subtitle' => $m->meeting_date->locale('id')->translatedFormat('l, j M · H.i').($m->location ? " · {$m->location}" : ''),
                'link' => "/meetings/{$m->id}",
            ])->values(),
        ];
    }

    /** Penyelesaian tepat waktu per departemen penanggung jawab. */
    private function departmentProgress($tasks): array
    {
        return [
            'type' => 'progress',
            'title' => 'Selesai tepat waktu per departemen',
            'items' => $tasks->groupBy(fn (Task $t) => $t->assignee?->department ?: 'Tanpa departemen')
                ->map(function ($group, $department) {
                    $onTime = $group->filter(fn (Task $t) => $t->status === TaskStatus::Done
                        && $t->completed_at && $t->completed_at->lte($t->deadline->copy()->endOfDay()));

                    return ['label' => "{$department} ({$onTime->count()}/{$group->count()})", 'value' => round($onTime->count() / $group->count(), 4)];
                })
                ->sortBy('value')
                ->values(),
        ];
    }

    private function meetingTable($meetings): array
    {
        return [
            'type' => 'table',
            'title' => 'Rapat dalam periode',
            'columns' => [
                ['key' => 'tanggal', 'label' => 'Tanggal', 'format' => 'date'],
                ['key' => 'agenda', 'label' => 'Agenda'],
                ['key' => 'tempat', 'label' => 'Tempat'],
                ['key' => 'tindak_lanjut', 'label' => 'Tindak lanjut', 'format' => 'number'],
            ],
            'rows' => $meetings->take(20)->map(fn (Meeting $m) => [
                'id' => $m->id,
                'tanggal' => $m->meeting_date->toDateString(),
                'agenda' => $m->title,
                'tempat' => $m->location ?: ($m->location_type === 'online' ? 'Daring' : '—'),
                'tindak_lanjut' => $m->follow_up_items_count,
            ])->values(),
            'row_link' => '/meetings/{id}',
        ];
    }

    private function daysLate(Task $task): int
    {
        return (int) Carbon::parse($task->deadline)->startOfDay()->diffInDays(now()->startOfDay());
    }
}
