<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Channels\WhatsAppMessage;
use App\Models\DailyWorkLog;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkLogSubmitted extends Notification
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
        return [
            'type' => 'work_log_submitted',
            'title' => "Laporan Harian Baru: {$this->log->user->name} — {$this->log->log_date->format('d M Y')}",
            'work_log_id' => $this->log->id,
            'log_date' => $this->log->log_date->format('d M Y'),
            'submitted_by' => $this->log->user->name,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $log = $this->log;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $itemCount = $log->items()->count();

        return (new MailMessage)
            ->subject("Laporan Harian Baru: {$log->user->name} — {$log->log_date->translatedFormat('d F Y')}")
            ->greeting("Yth. {$notifiable->name},")
            ->line('Dengan hormat,')
            ->line("Kami informasikan bahwa terdapat laporan harian baru yang memerlukan peninjauan Anda:")
            ->line('')
            ->line("**Nama Karyawan:** {$log->user->name}")
            ->line("**Tanggal Laporan:** {$log->log_date->translatedFormat('l, d F Y')}")
            ->line("**Jumlah Aktivitas:** {$itemCount} item")
            ->line("**Catatan:** " . ($log->notes ?? '-'))
            ->line('')
            ->line('Mohon untuk segera melakukan peninjauan dan memberikan persetujuan atas laporan tersebut.')
            ->action('Tinjau Laporan', "{$frontendUrl}/work-logs/{$log->id}")
            ->line('Demikian informasi ini kami sampaikan. Terima kasih.')
            ->salutation("Hormat kami,\nSekretariat YAPI");
    }

    public function toWhatsapp(object $notifiable): WhatsAppMessage
    {
        $log = $this->log;
        $itemCount = $log->items()->count();

        $content = "Yth. *{$notifiable->name}*,\n\n"
            . "Dengan hormat,\n"
            . "Terdapat laporan harian baru yang memerlukan peninjauan Anda:\n\n"
            . "━━━━━━━━━━━━━━━━━━\n"
            . "📊 *LAPORAN HARIAN BARU*\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "👤 *Nama Karyawan:*\n"
            . "{$log->user->name}\n\n"
            . "📅 *Tanggal Laporan:*\n"
            . "{$log->log_date->translatedFormat('l, d F Y')}\n\n"
            . "📋 *Jumlah Aktivitas:* {$itemCount} item\n\n"
            . "📝 *Catatan:*\n"
            . ($log->notes ?? '-') . "\n\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "Mohon untuk segera melakukan peninjauan dan memberikan persetujuan.\n\n"
            . "Terima kasih.\n\n"
            . "Hormat kami,\n"
            . "*Sekretariat YAPI*";

        return new WhatsAppMessage($content);
    }
}
