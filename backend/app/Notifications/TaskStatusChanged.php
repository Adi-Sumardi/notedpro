<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Channels\WhatsAppMessage;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        public Task $task,
        public string $oldStatus,
        public string $newStatus,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'mail'];

        if ($notifiable->phone) {
            $channels[] = WhatsAppChannel::class;
        }

        return $channels;
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'todo' => 'To Do',
            'in_progress' => 'In Progress',
            'review' => 'Review',
            'done' => 'Selesai',
            default => ucfirst($status),
        };
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_status_changed',
            'title' => "Pembaruan Status: \"{$this->task->title}\" — {$this->statusLabel($this->newStatus)}",
            'task_id' => $this->task->id,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'changed_by' => $this->task->assignee->name,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $t = $this->task;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        return (new MailMessage)
            ->subject("Pembaruan Status Tugas: {$t->title}")
            ->greeting("Yth. {$notifiable->name},")
            ->line('Dengan hormat,')
            ->line("Kami informasikan bahwa terdapat pembaruan status pada tugas berikut:")
            ->line('')
            ->line("**Judul Tugas:** {$t->title}")
            ->line("**Status Sebelumnya:** {$this->statusLabel($this->oldStatus)}")
            ->line("**Status Terbaru:** {$this->statusLabel($this->newStatus)}")
            ->line("**Diperbarui oleh:** {$t->assignee->name}")
            ->line("**Deadline:** {$t->deadline->translatedFormat('l, d F Y')}")
            ->line('')
            ->action('Lihat Detail Tugas', "{$frontendUrl}/tasks/{$t->id}")
            ->line('Demikian informasi ini kami sampaikan. Terima kasih.')
            ->salutation("Hormat kami,\nSekretariat YAPI");
    }

    public function toWhatsapp(object $notifiable): WhatsAppMessage
    {
        $t = $this->task;

        $content = "Yth. *{$notifiable->name}*,\n\n"
            . "Dengan hormat,\n"
            . "Kami informasikan terdapat pembaruan status pada tugas berikut:\n\n"
            . "━━━━━━━━━━━━━━━━━━\n"
            . "🔄 *PEMBARUAN STATUS*\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "📌 *Judul Tugas:*\n"
            . "{$t->title}\n\n"
            . "📊 *Status:*\n"
            . "{$this->statusLabel($this->oldStatus)} ➜ *{$this->statusLabel($this->newStatus)}*\n\n"
            . "👤 *Diperbarui oleh:*\n"
            . "{$t->assignee->name}\n\n"
            . "📅 *Deadline:*\n"
            . "{$t->deadline->translatedFormat('l, d F Y')}\n\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "Terima kasih.\n\n"
            . "Hormat kami,\n"
            . "*Sekretariat YAPI*";

        return new WhatsAppMessage($content);
    }
}
