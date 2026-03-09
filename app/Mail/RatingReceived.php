<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RatingReceived extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('rating_received'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('rating-received'),
            with: [
                'user' => $this->user,
                'rating' => $this->data['rating'] ?? null,
                'from_user' => $this->data['from_user'] ?? null,
            ],
        );
    }
}
