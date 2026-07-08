<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class AdminTripAutoCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public int $tripsCount) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $platformName = \App\Models\PlatformSetting::get('platform_name', config('app.name'));
        $locale = $notifiable->locale ?? 'fr';

        return (new MailMessage)
            ->subject($locale === 'fr'
                ? "[Admin] {$this->tripsCount} voyage(s) terminé(s) automatiquement"
                : "[Admin] {$this->tripsCount} trip(s) auto-completed")
            ->view("emails.{$locale}.admin-trip-auto-completed", [
                'user' => $notifiable,
                'tripsCount' => $this->tripsCount,
                'platformName' => $platformName,
            ]);
    }
}
