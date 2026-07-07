<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\PlatformSetting;

class WithdrawalCompleted extends Mailable
{
    use Queueable, SerializesModels;

    public string $platformName;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $user,
        public array $data
    ) {
        $this->platformName = PlatformSetting::get('platform_name', 'TumaPlus');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('emails.withdrawal_completed.subject', [], $this->user->locale ?? 'fr'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $locale = $this->user->locale ?? 'fr';
        
        return new Content(
            view: "emails.{$locale}.withdrawal-completed",
            with: [
                'user' => $this->user,
                'amount' => $this->data['amount'],
                'fee' => $this->data['fee'],
                'net_amount' => $this->data['net_amount'],
                'withdrawal_id' => $this->data['withdrawal_id'],
                'currency' => $this->data['currency'] ?? 'XAF',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
