<?php

namespace App\Notifications;

use App\Models\RechargeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RechargeRequestProcessingNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public RechargeRequest $rechargeRequest) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $platformName = \App\Models\PlatformSetting::get('platform_name', config('app.name'));
        $locale = $notifiable->locale ?? 'fr';
        $template = "emails.{$locale}.recharge-request-processing";

        return (new MailMessage)
            ->subject($locale === 'fr' ? 'Votre demande de recharge est en cours de traitement' : 'Your recharge request is being processed')
            ->view($template, [
                'user'            => $notifiable,
                'rechargeRequest' => $this->rechargeRequest,
                'platformName'    => $platformName,
            ]);
    }
}
