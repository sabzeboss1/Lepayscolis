<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WalletBalanceAdjusted extends Mailable
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
            subject: __('emails.wallet_balance_adjusted.subject', [], $this->user->locale ?? 'fr'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $locale = $this->user->locale ?? 'fr';
        
        return new Content(
            view: "emails.{$locale}.wallet-balance-adjusted",
            with: [
                'user' => $this->user,
                'amount' => $this->data['amount'],
                'is_positive' => $this->data['is_positive'],
                'new_balance' => $this->data['new_balance'],
                'reason' => $this->data['reason'],
                'admin_name' => $this->data['admin_name'],
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
