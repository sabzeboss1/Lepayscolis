<?php

namespace App\Notifications;

use App\Models\Shipment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EscrowReleasedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Shipment $shipment,
        public float $amount,
        public string $currency
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $platformName = \App\Models\PlatformSetting::get('platform_name', config('app.name'));
        $locale = $notifiable->locale ?? 'fr';
        $template = "emails.{$locale}.escrow-released";

        return (new MailMessage)
            ->subject($locale === 'fr'
                ? 'Vos fonds ont été restitués'
                : 'Your funds have been returned')
            ->view($template, [
                'user'         => $notifiable,
                'shipment'     => $this->shipment,
                'amount'       => $this->amount,
                'currency'     => $this->currency,
                'platformName' => $platformName,
            ]);
    }
}
