<?php

namespace App\Channels;

use App\Services\WatzapService;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Notification;

class WhatsAppChannel
{
    public function __construct(private WatzapService $watzap) {}

    public function send(object $notifiable, Notification $notification): void
    {
        /** @var WhatsAppMessage $message */
        $message = $notification->toWhatsapp($notifiable);

        // Get phone: from AnonymousNotifiable route or from model property
        $phone = $notifiable instanceof AnonymousNotifiable
            ? ($notifiable->routes[self::class] ?? null)
            : ($notifiable->phone ?? null);

        if (! $phone) {
            return;
        }

        $this->watzap->sendMessage($phone, $message->content);
    }
}
