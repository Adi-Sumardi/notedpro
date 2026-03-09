<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Enums\WorkLogStatus;
use App\Models\DailyWorkLog;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;

class HrReportService
{
    public function getEmployeeReport(array $filters): array
    {
        $dateFrom = $filters['date_from'] ?? Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $filters['date_to'] ?? Carbon::now()->toDateString();

        $users = User::query()
            ->whereDoesntHave('roles', fn ($q) => $q->whereIn('name', ['super-admin', 'admin']))
            ->when(! empty($filters['user_id']), fn ($q) => $q->where('id', $filters['user_id']))
            ->when(! empty($filters['department']), fn ($q) => $q->where('department', $filters['department']))
            ->orderBy('name')
            ->get();

        $report = [];

        foreach ($users as $user) {
            $taskQuery = Task::where('assigned_to', $user->id);
            $periodTaskQuery = (clone $taskQuery)->whereBetween('created_at', [$dateFrom, Carbon::parse($dateTo)->endOfDay()]);

            $totalTasks = $periodTaskQuery->count();
            $completedTasks = (clone $periodTaskQuery)->where('status', TaskStatus::Done)->count();
            $inProgressTasks = (clone $periodTaskQuery)->where('status', TaskStatus::InProgress)->count();
            $reviewTasks = (clone $periodTaskQuery)->where('status', TaskStatus::Review)->count();
            $overdueTasks = (clone $periodTaskQuery)
                ->where('deadline', '<', now()->toDateString())
                ->where('status', '!=', TaskStatus::Done)
                ->count();

            $workLogQuery = DailyWorkLog::where('user_id', $user->id)
                ->whereBetween('log_date', [$dateFrom, $dateTo]);

            $totalWorkLogs = (clone $workLogQuery)->count();
            $approvedWorkLogs = (clone $workLogQuery)->where('status', WorkLogStatus::Approved)->count();

            $report[] = [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'position' => $user->position,
                    'department' => $user->department,
                ],
                'tasks' => [
                    'total' => $totalTasks,
                    'completed' => $completedTasks,
                    'in_progress' => $inProgressTasks,
                    'review' => $reviewTasks,
                    'overdue' => $overdueTasks,
                    'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
                ],
                'work_logs' => [
                    'total' => $totalWorkLogs,
                    'approved' => $approvedWorkLogs,
                ],
            ];
        }

        return [
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'employees' => $report,
        ];
    }

    public function getDepartments(): array
    {
        return User::query()
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->sort()
            ->values()
            ->toArray();
    }
}
