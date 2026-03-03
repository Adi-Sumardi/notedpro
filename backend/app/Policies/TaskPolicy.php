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

        return $task->assigned_to === $user->id;
    }

    public function updateStatus(User $user, Task $task): bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }

        return $user->can('update-task-status') && $task->assigned_to === $user->id;
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
