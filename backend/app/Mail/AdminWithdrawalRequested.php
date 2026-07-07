<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\PlatformSetting;

class AdminWithdrawalRequested extends Mailable
{
    use Queueable, SerializesModels;

    public string $platformName;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $admin,
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
            subject: __('emails.admin.withdrawal_requested.subject', [], $this->admin->locale ?? 'fr'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $locale = $this->admin->locale ?? 'fr';
        
        return new Content(
            view: "emails.{$locale}.admin-withdrawal-requested",
            with: [
                'admin' => $this->admin,
                'withdrawal_id' => $this->data['withdrawal_id'],
                'user_name' => $this->data['user_name'],
                'user_email' => $this->data['user_email'],
                'user_id' => $this->data['user_id'],
                'amount' => $this->data['amount'],
                'fee' => $this->data['fee'],
                'net_amount' => $this->data['net_amount'],
                'created_at' => $this->data['created_at'],
                'currency' => $this->data['currency'] ?? PlatformSetting::getDefaultCurrency(),
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
