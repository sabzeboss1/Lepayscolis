<?php

namespace App\Notifications;

use App\Models\Trip;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class TripCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Trip $trip) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $platformName = \App\Models\PlatformSetting::get('platform_name', config('app.name'));
        $locale = $notifiable->locale ?? 'fr';

        return (new MailMessage)
            ->subject($locale === 'fr' ? 'Votre voyage est terminé' : 'Your trip has been completed')
            ->view("emails.{$locale}.trip-completed", [
                'user' => $notifiable,
                'trip' => $this->trip,
                'platformName' => $platformName,
            ]);
    }
}
