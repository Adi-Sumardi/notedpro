<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WatzapService
{
    public function sendMessage(string $phone, string $message): void
    {
        $apiKey = config('services.watzap.api_key');
        $numberKey = config('services.watzap.number_key');

        if (! $apiKey || ! $numberKey) {
            Log::warning('Watzap: API key or number key not configured, skipping WhatsApp notification.');
            return;
        }

        try {
            $response = Http::post('https://api.watzap.id/v1/send_message', [
                'api_key' => $apiKey,
                'number_key' => $numberKey,
                'phone_no' => $phone,
                'message' => $message,
            ]);

            if ($response->failed()) {
                Log::error('Watzap: Failed to send WhatsApp message', [
                    'phone' => $phone,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Watzap: Exception sending WhatsApp message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
