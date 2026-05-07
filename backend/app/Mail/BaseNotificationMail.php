<?php

namespace App\Mail;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

abstract class BaseNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $platformName;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $user,
        public array $data = []
    ) {
        $this->platformName = PlatformSetting::get('platform_name', 'TumaPlus');
    }

    /**
     * Get the message envelope.
     */
    abstract public function envelope(): Envelope;

    /**
     * Get the message content definition.
     */
    abstract public function content(): Content;

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    /**
     * Get the locale for the email based on user preference.
     */
    protected function getLocale(): string
    {
        return $this->user->locale ?? 'fr';
    }

    /**
     * Get translated subject line.
     */
    protected function getSubject(string $key): string
    {
        return __("mail.{$key}.subject", [], $this->getLocale());
    }

    /**
     * Get the view name based on locale.
     */
    protected function getView(string $template): string
    {
        $locale = $this->getLocale();
        return "emails.{$locale}.{$template}";
    }
}
