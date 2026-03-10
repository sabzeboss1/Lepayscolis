<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PaymentRefunded extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('payment_refunded'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('payment-refunded'),
            with: [
                'user' => $this->user,
                'payment' => $this->data['payment'] ?? null,
                'shipment' => $this->data['shipment'] ?? null,
            ],
        );
    }
}
