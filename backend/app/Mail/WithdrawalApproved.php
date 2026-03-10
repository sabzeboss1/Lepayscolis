<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WithdrawalApproved extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $user,
        public array $data
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('emails.withdrawal_approved.subject', [], $this->user->locale ?? 'fr'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $locale = $this->user->locale ?? 'fr';
        
        return new Content(
            view: "emails.{$locale}.withdrawal-approved",
            with: [
                'user' => $this->user,
                'amount' => $this->data['amount'],
                'fee' => $this->data['fee'],
                'net_amount' => $this->data['net_amount'],
                'withdrawal_id' => $this->data['withdrawal_id'],
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
