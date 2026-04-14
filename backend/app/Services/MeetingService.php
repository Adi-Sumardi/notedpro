<?php

namespace App\Services;

use App\Channels\WhatsAppChannel;
use App\Models\ExternalContact;
use App\Models\Meeting;
use App\Models\User;
use App\Notifications\NewMeetingInvitation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class MeetingService
{
    public function list(array $filters, User $user): LengthAwarePaginator
    {
        $query = Meeting::with(['creator', 'participants'])
            ->withCount(['participants', 'followUpItems']);

        // Non-admin users only see meetings they participate in
        if (! $user->hasAnyRole(['super-admin', 'admin'])) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhereHas('participants', fn ($q2) => $q2->where('user_id', $user->id));
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['date_from'])) {
            $query->where('meeting_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->where('meeting_date', '<=', $filters['date_to']);
        }

        $sortBy    = in_array($filters['sort_by'] ?? '', ['created_at', 'meeting_date']) ? $filters['sort_by'] : 'meeting_date';
        $sortOrder = ($filters['sort_order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)
            ->paginate($filters['per_page'] ?? 12);
    }

    public function create(array $data, User $user, ?UploadedFile $attachment = null): Meeting
    {
        $meeting = DB::transaction(function () use ($data, $user, $attachment) {
            $meetingData = [
                ...$data,
                'created_by' => $user->id,
                'status' => $data['status'] ?? 'draft',
            ];

            if ($attachment) {
                $meetingData['attachment_path'] = $attachment->store('meetings/attachments', 'public');
                $meetingData['attachment_original_name'] = $attachment->getClientOriginalName();
            }

            $meeting = Meeting::create($meetingData);

            // Internal participants (users with accounts)
            if (! empty($data['participants'])) {
                $participants = collect($data['participants'])->mapWithKeys(fn ($p) => [
                    $p['user_id'] => ['role' => $p['role']],
                ]);
                $meeting->participants()->attach($participants);
            }

            // Auto-add creator as host if not in participants
            if (! $meeting->participants()->where('user_id', $user->id)->exists()) {
                $meeting->participants()->attach($user->id, ['role' => 'host']);
            }

            // External participants (stakeholders without accounts)
            if (! empty($data['external_participants'])) {
                $externalAttach = [];
                foreach ($data['external_participants'] as $ext) {
                    // Reuse existing contact or create new one
                    $contact = isset($ext['id'])
                        ? ExternalContact::find($ext['id'])
                        : ExternalContact::create([
                            'name' => $ext['name'],
                            'email' => $ext['email'] ?? null,
                            'phone' => $ext['phone'] ?? null,
                            'organization' => $ext['organization'] ?? null,
                            'position' => $ext['position'] ?? null,
                        ]);

                    if ($contact) {
                        $externalAttach[$contact->id] = ['role' => $ext['role'] ?? 'participant'];
                    }
                }
                $meeting->externalParticipants()->attach($externalAttach);
            }

            return $meeting->load(['creator', 'participants', 'externalParticipants']);
        });

        // Send notifications to internal participants
        $meeting->participants->each(function (User $participant) use ($meeting) {
            $participant->notify(new NewMeetingInvitation($meeting));
        });

        // Send notifications to external participants (on-demand, no account needed)
        $this->notifyExternalParticipants($meeting);

        return $meeting;
    }

    private function notifyExternalParticipants(Meeting $meeting): void
    {
        foreach ($meeting->externalParticipants as $ext) {
            $channels = [];

            if ($ext->email) {
                $channels[] = 'mail';
            }
            if ($ext->phone) {
                $channels[] = WhatsAppChannel::class;
            }

            if (empty($channels)) {
                continue;
            }

            // On-demand notification — no User model needed
            $route = Notification::route('mail', $ext->email);

            if ($ext->phone) {
                $route = $route->route(WhatsAppChannel::class, $ext->phone);
            }

            $route->notify(new NewMeetingInvitation($meeting));
        }
    }

    public function update(Meeting $meeting, array $data): Meeting
    {
        $meeting->update($data);

        return $meeting->load(['creator', 'participants']);
    }
}
