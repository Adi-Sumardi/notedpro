<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }

        // SDM can view all tasks (read-only monitoring)
        if ($user->can('view-all-tasks')) {
            return true;
        }

        // Kabag can view team tasks
        if ($user->can('view-team-tasks')) {
            return true;
        }

        return $task->assigned_to === $user->id;
    }

    public function updateStatus(User $user, Task $task): bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }

        return $user->can('update-task-status') && $task->assigned_to === $user->id;
    }

    public function verify(User $user, Task $task): bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }

        return $user->can('verify-task') && $task->status->value === 'review';
    }

    public function update(User $user, Task $task): bool
    {
        return $user->can('assign-task');
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->can('assign-task');
    }
}
