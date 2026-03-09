<?php

namespace App\Policies;

use App\Models\DailyWorkLog;
use App\Models\User;

class DailyWorkLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view-own-work-log') || $user->can('view-team-work-log') || $user->can('view-all-work-logs');
    }

    public function view(User $user, DailyWorkLog $log): bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin']) || $user->can('view-team-work-log') || $user->can('view-all-work-logs')) {
            return true;
        }

        return $log->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('create-work-log');
    }

    public function update(User $user, DailyWorkLog $log): bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }

        return $log->user_id === $user->id && ($log->isDraft() || $log->status === \App\Enums\WorkLogStatus::Rejected);
    }

    public function delete(User $user, DailyWorkLog $log): bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }

        return $log->user_id === $user->id && $log->isDraft();
    }

    public function submit(User $user, DailyWorkLog $log): bool
    {
        return $log->user_id === $user->id && ($log->isDraft() || $log->status === \App\Enums\WorkLogStatus::Rejected);
    }

    public function review(User $user, DailyWorkLog $log): bool
    {
        if (! $log->isSubmitted()) {
            return false;
        }

        return $user->can('review-work-log');
    }
}
