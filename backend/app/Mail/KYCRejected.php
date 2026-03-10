<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class KYCRejected extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('kyc_rejected'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('kyc-rejected'),
            with: [
                'user' => $this->user,
                'reason' => $this->data['reason'] ?? '',
            ],
        );
    }
}
