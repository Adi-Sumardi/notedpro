<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;

class DashboardService
{
    public function getSummary(?User $scopeUser = null): array
    {
        $query = Task::query();

        if ($scopeUser) {
            $query->where('assigned_to', $scopeUser->id);
        }

        $total = $query->count();

        $byStatus = [];
        foreach (TaskStatus::cases() as $status) {
            $byStatus[$status->value] = (clone $query)->where('status', $status)->count();
        }

        $overdue = (clone $query)
            ->where('deadline', '<', now()->toDateString())
            ->where('status', '!=', TaskStatus::Done)
            ->count();

        $dueThisWeek = (clone $query)
            ->whereBetween('deadline', [now()->toDateString(), now()->endOfWeek()->toDateString()])
            ->where('status', '!=', TaskStatus::Done)
            ->count();

        $completionRate = $total > 0 ? round(($byStatus[TaskStatus::Done->value] / $total) * 100, 1) : 0;

        $result = [
            'total_tasks' => $total,
            'by_status' => $byStatus,
            'overdue' => $overdue,
            'due_this_week' => $dueThisWeek,
            'completion_rate' => $completionRate,
        ];

        // Only include priority breakdown for admin dashboard
        if (! $scopeUser) {
            $byPriority = [];
            foreach (\App\Enums\Priority::cases() as $priority) {
                $byPriority[$priority->value] = Task::where('priority', $priority)->count();
            }
            $result['by_priority'] = $byPriority;
        }

        return $result;
    }
}
