<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Channels\WhatsAppMessage;
use App\Models\DailyWorkLog;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkLogReviewed extends Notification
{
    use Queueable;

    public function __construct(public DailyWorkLog $log) {}

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
        $statusText = $this->log->status->value === 'approved' ? 'Disetujui' : 'Ditolak';

        return [
            'type' => 'work_log_reviewed',
            'title' => "Laporan Harian {$statusText}: {$this->log->log_date->format('d M Y')}",
            'work_log_id' => $this->log->id,
            'log_date' => $this->log->log_date->format('d M Y'),
            'status' => $this->log->status->value,
            'reviewed_by' => $this->log->reviewer?->name,
            'comment' => $this->log->review_comment,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $log = $this->log;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $isApproved = $log->status->value === 'approved';
        $statusText = $isApproved ? 'Disetujui' : 'Ditolak';
        $emoji = $isApproved ? '✅' : '❌';

        $mail = (new MailMessage)
            ->subject("{$emoji} Laporan Harian {$statusText} — {$log->log_date->translatedFormat('d F Y')}")
            ->greeting("Yth. {$notifiable->name},")
            ->line('Dengan hormat,')
            ->line("Kami informasikan bahwa laporan harian Anda telah ditinjau dengan hasil sebagai berikut:")
            ->line('')
            ->line("**Tanggal Laporan:** {$log->log_date->translatedFormat('l, d F Y')}")
            ->line("**Status:** {$statusText}")
            ->line("**Ditinjau oleh:** {$log->reviewer?->name}");

        if ($log->review_comment) {
            $mail->line("**Komentar:** {$log->review_comment}");
        }

        $mail->line('');

        if (! $isApproved) {
            $mail->line('Mohon untuk memperbaiki laporan Anda sesuai dengan catatan yang diberikan dan mengajukan kembali.');
        }

        return $mail
            ->action('Lihat Laporan', "{$frontendUrl}/work-logs/{$log->id}")
            ->line('Demikian informasi ini kami sampaikan. Terima kasih.')
            ->salutation("Hormat kami,\nSekretariat YAPI");
    }

    public function toWhatsapp(object $notifiable): WhatsAppMessage
    {
        $log = $this->log;
        $isApproved = $log->status->value === 'approved';
        $statusText = $isApproved ? 'DISETUJUI' : 'DITOLAK';
        $emoji = $isApproved ? '✅' : '❌';

        $content = "Yth. *{$notifiable->name}*,\n\n"
            . "Dengan hormat,\n"
            . "Kami informasikan bahwa laporan harian Anda telah ditinjau:\n\n"
            . "━━━━━━━━━━━━━━━━━━\n"
            . "{$emoji} *LAPORAN HARIAN {$statusText}*\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "📅 *Tanggal Laporan:*\n"
            . "{$log->log_date->translatedFormat('l, d F Y')}\n\n"
            . "📊 *Status:* *{$statusText}*\n\n"
            . "👤 *Ditinjau oleh:*\n"
            . "{$log->reviewer?->name}\n\n";

        if ($log->review_comment) {
            $content .= "💬 *Komentar:*\n"
                . "{$log->review_comment}\n\n";
        }

        $content .= "━━━━━━━━━━━━━━━━━━\n\n";

        if (! $isApproved) {
            $content .= "Mohon untuk memperbaiki laporan Anda sesuai dengan catatan yang diberikan dan mengajukan kembali.\n\n";
        }

        $content .= "Terima kasih.\n\n"
            . "Hormat kami,\n"
            . "*Sekretariat YAPI*";

        return new WhatsAppMessage($content);
    }
}
