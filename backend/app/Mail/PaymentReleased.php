<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PaymentReleased extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('payment_released'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('payment-released'),
            with: [
                'user' => $this->user,
                'payment' => $this->data['payment'] ?? null,
                'shipment' => $this->data['shipment'] ?? null,
            ],
        );
    }
}
