<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class KYCApproved extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('kyc_approved'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('kyc-approved'),
            with: [
                'user' => $this->user,
            ],
        );
    }
}
