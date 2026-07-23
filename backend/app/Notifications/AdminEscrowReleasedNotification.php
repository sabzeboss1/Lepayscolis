<?php

namespace App\Notifications;

use App\Models\Shipment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminEscrowReleasedNotification extends Notification implements ShouldQueue
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
        $template = "emails.{$locale}.admin-escrow-released";

        return (new MailMessage)
            ->subject($locale === 'fr'
                ? 'Fonds escrow libérés manuellement'
                : 'Escrow funds manually released')
            ->view($template, [
                'admin'        => $notifiable,
                'shipment'     => $this->shipment,
                'amount'       => $this->amount,
                'currency'     => $this->currency,
                'platformName' => $platformName,
            ]);
    }
}
