<?php

namespace App\Notifications;

use App\Models\RechargeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RechargeRequestRejectedNotification extends Notification implements ShouldQueue
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
        $template = "emails.{$locale}.recharge-request-rejected";

        return (new MailMessage)
            ->subject($locale === 'fr' ? 'Votre demande de recharge a été refusée' : 'Your recharge request has been rejected')
            ->view($template, [
                'user'            => $notifiable,
                'rechargeRequest' => $this->rechargeRequest,
                'platformName'    => $platformName,
            ]);
    }
}
