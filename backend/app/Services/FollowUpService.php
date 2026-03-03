<?php

namespace App\Services;

use App\Enums\FollowUpStatus;
use App\Models\FollowUpItem;
use App\Models\Meeting;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;
use App\Notifications\TaskAssigned;
use Illuminate\Support\Facades\DB;

class FollowUpService
{
    public function listForMeeting(Meeting $meeting)
    {
        return $meeting->followUpItems()
            ->with(['creator', 'tasks.assignee'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(Meeting $meeting, array $data, User $user): FollowUpItem
    {
        return DB::transaction(function () use ($meeting, $data, $user) {
            $hasAssignees = ! empty($data['assignees']);

            $followUp = FollowUpItem::create([
                'meeting_id' => $meeting->id,
                'meeting_note_id' => $data['meeting_note_id'],
                'highlighted_text' => $data['highlighted_text'],
                'highlight_start' => $data['highlight_start'] ?? null,
                'highlight_end' => $data['highlight_end'] ?? null,
                'highlight_color' => $data['highlight_color'] ?? '#FEF08A',
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'status' => $hasAssignees ? FollowUpStatus::Assigned : FollowUpStatus::Open,
                'created_by' => $user->id,
            ]);

            // Create tasks for each assignee
            if ($hasAssignees) {
                foreach ($data['assignees'] as $assignee) {
                    $task = Task::create([
                        'follow_up_item_id' => $followUp->id,
                        'assigned_to' => $assignee['user_id'],
                        'assigned_by' => $user->id,
                        'title' => $data['title'],
                        'description' => $data['description'] ?? null,
                        'priority' => $data['priority'] ?? 'medium',
                        'deadline' => $assignee['deadline'],
                        'status' => 'todo',
                    ]);

                    TaskActivity::create([
                        'task_id' => $task->id,
                        'user_id' => $user->id,
                        'action' => 'created',
                        'new_value' => 'todo',
                    ]);

                    $assigneeUser = User::find($assignee['user_id']);
                    $assigneeUser->notify(new TaskAssigned($task));
                }
            }

            return $followUp;
        });
    }

    public function update(FollowUpItem $followUp, array $data): FollowUpItem
    {
        $followUp->update($data);

        return $followUp->fresh(['creator', 'tasks.assignee']);
    }
}
