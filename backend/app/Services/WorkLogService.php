<?php

namespace App\Services;

use App\Enums\WorkLogStatus;
use App\Models\DailyWorkLog;
use App\Models\User;
use App\Notifications\WorkLogReviewed;
use App\Notifications\WorkLogSubmitted;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class WorkLogService
{
    public function list(array $filters, User $user): LengthAwarePaginator
    {
        $query = DailyWorkLog::with(['user', 'reviewer'])
            ->withCount('items');

        // Staff sees own only, manager/admin sees all
        if (! $user->hasAnyRole(['super-admin', 'admin']) && ! $user->can('view-team-work-log')) {
            $query->where('user_id', $user->id);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (! empty($filters['status'])) {
            $statuses = is_array($filters['status']) ? $filters['status'] : explode(',', $filters['status']);
            $query->whereIn('status', $statuses);
        }

        if (! empty($filters['date_from'])) {
            $query->where('log_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->where('log_date', '<=', $filters['date_to']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('notes', 'like', "%{$filters['search']}%")
                    ->orWhereHas('items', fn ($q2) => $q2->where('description', 'like', "%{$filters['search']}%"));
            });
        }

        $sortBy = $filters['sort_by'] ?? 'log_date';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($filters['per_page'] ?? 20);
    }

    public function create(array $data, User $user): DailyWorkLog
    {
        return DB::transaction(function () use ($data, $user) {
            $log = DailyWorkLog::create([
                'user_id' => $user->id,
                'log_date' => $data['log_date'],
                'notes' => $data['notes'] ?? null,
                'status' => WorkLogStatus::Draft,
            ]);

            foreach ($data['items'] as $item) {
                $log->items()->create($item);
            }

            return $log->load(['user', 'items']);
        });
    }

    public function update(DailyWorkLog $log, array $data): DailyWorkLog
    {
        return DB::transaction(function () use ($log, $data) {
            $updateData = [
                'notes' => $data['notes'] ?? $log->notes,
            ];

            if (isset($data['log_date'])) {
                $updateData['log_date'] = $data['log_date'];
            }

            // Reset rejected back to draft on edit
            if ($log->status === WorkLogStatus::Rejected) {
                $updateData['status'] = WorkLogStatus::Draft;
                $updateData['reviewed_by'] = null;
                $updateData['reviewed_at'] = null;
                $updateData['review_comment'] = null;
            }

            $log->update($updateData);

            if (isset($data['items'])) {
                $incomingIds = collect($data['items'])
                    ->pluck('id')
                    ->filter()
                    ->toArray();

                $log->items()->whereNotIn('id', $incomingIds)->delete();

                foreach ($data['items'] as $itemData) {
                    if (! empty($itemData['id'])) {
                        $log->items()->where('id', $itemData['id'])->update([
                            'description' => $itemData['description'],
                            'category' => $itemData['category'],
                            'start_time' => $itemData['start_time'],
                            'end_time' => $itemData['end_time'],
                            'progress' => $itemData['progress'],
                        ]);
                    } else {
                        $log->items()->create($itemData);
                    }
                }
            }

            return $log->load(['user', 'items']);
        });
    }

    public function submit(DailyWorkLog $log): DailyWorkLog
    {
        return DB::transaction(function () use ($log) {
            $log->update([
                'status' => WorkLogStatus::Submitted,
                'submitted_at' => now(),
            ]);

            // Notify managers/admins
            $managers = User::role(['manager', 'admin'])->get();
            foreach ($managers as $manager) {
                $manager->notify(new WorkLogSubmitted($log));
            }

            return $log->load(['user', 'items']);
        });
    }

    public function review(DailyWorkLog $log, array $data, User $reviewer): DailyWorkLog
    {
        return DB::transaction(function () use ($log, $data, $reviewer) {
            $log->update([
                'status' => $data['status'],
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'review_comment' => $data['review_comment'] ?? null,
            ]);

            $log->user->notify(new WorkLogReviewed($log));

            return $log->load(['user', 'reviewer', 'items']);
        });
    }
}
