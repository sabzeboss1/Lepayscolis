<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AdminKYCSubmitted extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('admin_kyc_submitted'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('admin-kyc-submitted'),
            with: [
                'user' => $this->user,
                'kycData' => $this->data,
            ],
        );
    }
}
