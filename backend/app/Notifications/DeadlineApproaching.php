<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Channels\WhatsAppMessage;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DeadlineApproaching extends Notification
{
    use Queueable;

    public function __construct(public Task $task, public int $daysLeft) {}

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
            'type' => 'deadline_approaching',
            'title' => "Pengingat: Deadline \"{$this->task->title}\" dalam {$this->daysLeft} hari",
            'task_id' => $this->task->id,
            'deadline' => $this->task->deadline->format('d M Y'),
            'days_left' => $this->daysLeft,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $t = $this->task;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $urgency = $this->daysLeft <= 1 ? 'Sangat Mendesak' : 'Mendesak';

        return (new MailMessage)
            ->subject("[{$urgency}] Pengingat Deadline: {$t->title}")
            ->greeting("Yth. {$notifiable->name},")
            ->line('Dengan hormat,')
            ->line("Kami mengingatkan bahwa tugas berikut akan segera mencapai batas waktu penyelesaian:")
            ->line('')
            ->line("**Judul Tugas:** {$t->title}")
            ->line("**Deadline:** {$t->deadline->translatedFormat('l, d F Y')}")
            ->line("**Sisa Waktu:** {$this->daysLeft} hari lagi")
            ->line("**Prioritas:** {$t->priority->label()}")
            ->line('')
            ->line('Mohon segera menyelesaikan tugas ini sebelum batas waktu yang telah ditentukan.')
            ->action('Lihat Detail Tugas', "{$frontendUrl}/tasks/{$t->id}")
            ->line('Demikian pengingat ini kami sampaikan. Terima kasih atas perhatiannya.')
            ->salutation("Hormat kami,\nSekretariat YAPI");
    }

    public function toWhatsapp(object $notifiable): WhatsAppMessage
    {
        $t = $this->task;
        $emoji = $this->daysLeft <= 1 ? '🔴' : '🟡';

        $content = "Yth. *{$notifiable->name}*,\n\n"
            . "Dengan hormat,\n"
            . "Kami mengingatkan bahwa tugas berikut akan segera mencapai batas waktu:\n\n"
            . "━━━━━━━━━━━━━━━━━━\n"
            . "{$emoji} *PENGINGAT DEADLINE*\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "📌 *Judul Tugas:*\n"
            . "{$t->title}\n\n"
            . "📅 *Deadline:*\n"
            . "{$t->deadline->translatedFormat('l, d F Y')}\n\n"
            . "⏳ *Sisa Waktu:*\n"
            . "*{$this->daysLeft} hari lagi*\n\n"
            . "⚡ *Prioritas:* {$t->priority->label()}\n\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "Mohon segera menyelesaikan tugas ini sebelum batas waktu yang telah ditentukan.\n\n"
            . "Terima kasih atas perhatiannya.\n\n"
            . "Hormat kami,\n"
            . "*Sekretariat YAPI*";

        return new WhatsAppMessage($content);
    }
}
