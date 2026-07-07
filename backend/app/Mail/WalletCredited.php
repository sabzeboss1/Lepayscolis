<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class WalletCredited extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('wallet_credited'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('wallet-credited'),
            with: [
                'user' => $this->user,
                'amount' => $this->data['amount'] ?? 0,
                'new_balance' => $this->data['new_balance'] ?? 0,
                'description' => $this->data['description'] ?? '',
                'currency' => $this->data['currency'] ?? 'XAF',
            ],
        );
    }
}
