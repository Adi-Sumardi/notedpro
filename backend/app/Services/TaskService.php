<?php

namespace App\Services;

use App\Enums\FollowUpStatus;
use App\Enums\TaskStatus;
use App\Models\FollowUpItem;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskStatusChanged;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TaskService
{
    public function list(array $filters, User $user): LengthAwarePaginator
    {
        $query = Task::with(['assignee', 'assigner', 'followUpItem.meeting']);

        // SDM/Kabag with view-all-tasks or view-team-tasks can see all tasks
        // Others only see their own
        if (! $user->hasAnyRole(['super-admin', 'admin']) && ! $user->can('view-all-tasks') && ! $user->can('view-team-tasks')) {
            $query->where('assigned_to', $user->id);
        }

        if (! empty($filters['status'])) {
            $statuses = is_array($filters['status']) ? $filters['status'] : explode(',', $filters['status']);
            $query->whereIn('status', $statuses);
        }

        if (! empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        if (! empty($filters['priority'])) {
            $priorities = is_array($filters['priority']) ? $filters['priority'] : explode(',', $filters['priority']);
            $query->whereIn('priority', $priorities);
        }

        if (! empty($filters['deadline_from'])) {
            $query->where('deadline', '>=', $filters['deadline_from']);
        }

        if (! empty($filters['deadline_to'])) {
            $query->where('deadline', '<=', $filters['deadline_to']);
        }

        if (! empty($filters['meeting_id'])) {
            $query->whereHas('followUpItem', fn ($q) => $q->where('meeting_id', $filters['meeting_id']));
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['overdue']) && $filters['overdue'] === 'true') {
            $query->where('deadline', '<', now()->toDateString())
                ->where('status', '!=', TaskStatus::Done);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data, User $assigner): Task
    {
        return DB::transaction(function () use ($data, $assigner) {
            $task = Task::create([
                ...$data,
                'assigned_by' => $assigner->id,
                'status' => 'todo',
            ]);

            // Update follow-up status to assigned
            FollowUpItem::where('id', $data['follow_up_item_id'])
                ->update(['status' => FollowUpStatus::Assigned]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $assigner->id,
                'action' => 'created',
                'new_value' => 'todo',
            ]);

            // Notify assignee
            $assignee = User::find($data['assigned_to']);
            $assignee->notify(new TaskAssigned($task));

            return $task->load(['assignee', 'assigner', 'followUpItem.meeting']);
        });
    }

    public function updateStatus(Task $task, string $newStatus, User $user): Task
    {
        return DB::transaction(function () use ($task, $newStatus, $user) {
            $oldStatus = $task->status->value;

            $task->status = $newStatus;

            if ($newStatus === TaskStatus::Done->value) {
                $task->completed_at = now();

                // Check if all tasks for this follow-up are done
                $allDone = $task->followUpItem->tasks()
                    ->where('id', '!=', $task->id)
                    ->where('status', '!=', TaskStatus::Done)
                    ->doesntExist();

                if ($allDone) {
                    $task->followUpItem->update(['status' => FollowUpStatus::Done]);
                }
            }

            $task->save();

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'action' => 'status_changed',
                'old_value' => $oldStatus,
                'new_value' => $newStatus,
            ]);

            // Notify assigner about status change
            $task->assigner->notify(new TaskStatusChanged($task, $oldStatus, $newStatus));

            return $task->load(['assignee', 'assigner', 'followUpItem.meeting']);
        });
    }

    public function verifyTask(Task $task, string $newStatus, User $verifier, ?string $comment = null): Task
    {
        return DB::transaction(function () use ($task, $newStatus, $verifier, $comment) {
            $oldStatus = $task->status->value;

            $task->status = $newStatus;

            if ($newStatus === TaskStatus::Done->value) {
                $task->completed_at = now();

                $allDone = $task->followUpItem->tasks()
                    ->where('id', '!=', $task->id)
                    ->where('status', '!=', TaskStatus::Done)
                    ->doesntExist();

                if ($allDone) {
                    $task->followUpItem->update(['status' => FollowUpStatus::Done]);
                }
            }

            $task->save();

            $action = $newStatus === TaskStatus::Done->value ? 'verified' : 'rejected';

            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $verifier->id,
                'action' => $action,
                'old_value' => $oldStatus,
                'new_value' => $newStatus,
            ]);

            // Store verify comment as task comment
            if ($comment) {
                $task->comments()->create([
                    'user_id' => $verifier->id,
                    'content' => "[{$action}] {$comment}",
                ]);
            }

            // Notify assignee and assigner
            $task->assignee->notify(new TaskStatusChanged($task, $oldStatus, $newStatus));
            if ($task->assigner->id !== $verifier->id) {
                $task->assigner->notify(new TaskStatusChanged($task, $oldStatus, $newStatus));
            }

            return $task->load(['assignee', 'assigner', 'followUpItem.meeting']);
        });
    }
}
