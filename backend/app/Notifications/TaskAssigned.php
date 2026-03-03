<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Channels\WhatsAppMessage;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssigned extends Notification
{
    use Queueable;

    public function __construct(public Task $task) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'mail'];

        if ($notifiable->phone) {
            $channels[] = WhatsAppChannel::class;
        }

        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_assigned',
            'title' => "Penugasan Baru: {$this->task->title}",
            'task_id' => $this->task->id,
            'assigned_by' => $this->task->assigner->name,
            'deadline' => $this->task->deadline->format('d M Y'),
            'priority' => $this->task->priority->value,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $t = $this->task;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        return (new MailMessage)
            ->subject("Penugasan Baru: {$t->title}")
            ->greeting("Yth. {$notifiable->name},")
            ->line('Dengan hormat,')
            ->line("Kami informasikan bahwa Anda telah diberikan penugasan baru dengan detail sebagai berikut:")
            ->line('')
            ->line("**Judul Tugas:** {$t->title}")
            ->line("**Deskripsi:** " . ($t->description ?? '-'))
            ->line("**Prioritas:** {$t->priority->label()}")
            ->line("**Deadline:** {$t->deadline->translatedFormat('l, d F Y')}")
            ->line("**Ditugaskan oleh:** {$t->assigner->name}")
            ->line('')
            ->line('Mohon segera menindaklanjuti penugasan ini sesuai dengan batas waktu yang telah ditentukan.')
            ->action('Lihat Detail Tugas', "{$frontendUrl}/tasks/{$t->id}")
            ->line('Demikian informasi ini kami sampaikan. Terima kasih atas perhatian dan kerja samanya.')
            ->salutation("Hormat kami,\nSekretariat YAPI");
    }

    public function toWhatsapp(object $notifiable): WhatsAppMessage
    {
        $t = $this->task;

        $content = "Yth. *{$notifiable->name}*,\n\n"
            . "Dengan hormat,\n"
            . "Kami informasikan bahwa Anda telah diberikan penugasan baru:\n\n"
            . "━━━━━━━━━━━━━━━━━━\n"
            . "📋 *PENUGASAN BARU*\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "📌 *Judul Tugas:*\n"
            . "{$t->title}\n\n"
            . "📝 *Deskripsi:*\n"
            . ($t->description ?? '-') . "\n\n"
            . "⚡ *Prioritas:* {$t->priority->label()}\n\n"
            . "📅 *Deadline:*\n"
            . "{$t->deadline->translatedFormat('l, d F Y')}\n\n"
            . "👤 *Ditugaskan oleh:*\n"
            . "{$t->assigner->name}\n\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "Mohon segera menindaklanjuti penugasan ini sesuai dengan batas waktu yang telah ditentukan.\n\n"
            . "Terima kasih atas perhatian dan kerja samanya.\n\n"
            . "Hormat kami,\n"
            . "*Sekretariat YAPI*";

        return new WhatsAppMessage($content);
    }
}
