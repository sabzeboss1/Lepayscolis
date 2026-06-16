<?php

namespace App\Notifications;

use App\Models\RechargeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RechargeRequestCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public RechargeRequest $rechargeRequest) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $platformName = \App\Models\PlatformSetting::get('platform_name', config('app.name'));
        $locale = $notifiable->locale ?? 'fr';
        $template = "emails.{$locale}.recharge-request-completed";

        return (new MailMessage)
            ->subject($locale === 'fr' ? 'Votre portefeuille a été rechargé !' : 'Your wallet has been topped up!')
            ->view($template, [
                'user'            => $notifiable,
                'rechargeRequest' => $this->rechargeRequest,
                'platformName'    => $platformName,
            ]);
    }
}
