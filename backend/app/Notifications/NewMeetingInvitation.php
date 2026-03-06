<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Channels\WhatsAppMessage;
use App\Models\Meeting;
use App\Services\IcsGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Storage;

class NewMeetingInvitation extends Notification
{
    use Queueable;

    public function __construct(public Meeting $meeting) {}

    public function via(object $notifiable): array
    {
        if ($notifiable instanceof AnonymousNotifiable) {
            $channels = [];
            $routes = $notifiable->routes;

            if (! empty($routes['mail'])) {
                $channels[] = 'mail';
            }
            if (! empty($routes[WhatsAppChannel::class])) {
                $channels[] = WhatsAppChannel::class;
            }

            return $channels;
        }

        $channels = ['database', 'mail'];

        if ($notifiable->phone) {
            $channels[] = WhatsAppChannel::class;
        }

        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'meeting_invitation',
            'title' => "Undangan Rapat: {$this->meeting->title}",
            'meeting_id' => $this->meeting->id,
            'meeting_date' => $this->meeting->meeting_date->format('d M Y H:i'),
            'location' => $this->meeting->location,
            'invited_by' => $this->meeting->organizer ?? $this->meeting->creator->name,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $m = $this->meeting;
        $icsContent = IcsGenerator::generate($m);
        $name = $notifiable instanceof AnonymousNotifiable ? 'Bapak/Ibu' : $notifiable->name;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        $mail = (new MailMessage)
            ->subject("Undangan Rapat: {$m->title}")
            ->greeting("Yth. {$name},")
            ->line('Dengan hormat,')
            ->line("Bersama ini kami mengundang Bapak/Ibu untuk menghadiri rapat yang akan diselenggarakan dengan detail sebagai berikut:")
            ->line('')
            ->line("**Agenda:** {$m->title}")
            ->line("**Hari/Tanggal:** {$m->meeting_date->translatedFormat('l, d F Y')}")
            ->line("**Waktu:** {$m->meeting_date->format('H:i')} WIB")
            ->line("**Tempat:** " . ($m->location ?? 'Akan diinformasikan kemudian'))
            ->line("**Penyelenggara:** " . ($m->organizer ?? $m->creator->name))
            ->line('')
            ->when($m->description, fn (MailMessage $msg) => $msg->line("**Keterangan:** {$m->description}"))
            ->line('Mengingat pentingnya agenda yang akan dibahas, kami mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.')
            ->action('Lihat Detail Rapat', "{$frontendUrl}/meetings/{$m->id}")
            ->line('Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.')
            ->salutation("Hormat kami,\nSekretariat YAPI")
            ->attachData($icsContent, 'undangan-rapat.ics', [
                'mime' => 'text/calendar; method=REQUEST',
            ]);

        if ($m->attachment_path && Storage::disk('public')->exists($m->attachment_path)) {
            $mail->attach(Storage::disk('public')->path($m->attachment_path), [
                'as' => $m->attachment_original_name,
                'mime' => 'application/pdf',
            ]);
        }

        return $mail;
    }

    public function toWhatsapp(object $notifiable): WhatsAppMessage
    {
        $m = $this->meeting;
        $name = $notifiable instanceof AnonymousNotifiable ? 'Bapak/Ibu' : $notifiable->name;
        $date = $m->meeting_date->translatedFormat('l, d F Y');
        $time = $m->meeting_date->format('H:i');

        $content = "Yth. *{$name}*,\n\n"
            . "Dengan hormat,\n"
            . "Bersama ini kami mengundang Bapak/Ibu untuk menghadiri rapat berikut:\n\n"
            . "━━━━━━━━━━━━━━━━━━\n"
            . "📋 *UNDANGAN RAPAT*\n"
            . "━━━━━━━━━━━━━━━━━━\n\n"
            . "📌 *Agenda:*\n"
            . "{$m->title}\n\n"
            . "📅 *Hari/Tanggal:*\n"
            . "{$date}\n\n"
            . "⏰ *Waktu:*\n"
            . "{$time} WIB\n\n"
            . "📍 *Tempat:*\n"
            . ($m->location ?? 'Akan diinformasikan kemudian') . "\n\n"
            . "👤 *Penyelenggara:*\n"
            . ($m->organizer ?? $m->creator->name) . "\n\n";

        if ($m->description) {
            $content .= "📝 *Keterangan:*\n"
                . "{$m->description}\n\n";
        }

        if ($m->attachment_path) {
            $attachmentUrl = Storage::disk('public')->url($m->attachment_path);
            $content .= "📎 *Lampiran:*\n"
                . "{$m->attachment_original_name}\n"
                . "{$attachmentUrl}\n\n";
        }

        $content .= "━━━━━━━━━━━━━━━━━━\n\n"
            . "Mengingat pentingnya agenda yang akan dibahas, kami mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.\n\n"
            . "Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.\n\n"
            . "Hormat kami,\n"
            . "*Sekretariat YAPI*";

        return new WhatsAppMessage($content);
    }
}
