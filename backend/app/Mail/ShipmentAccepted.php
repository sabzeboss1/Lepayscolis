<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ShipmentAccepted extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('shipment_accepted'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('shipment-accepted'),
            with: [
                'user' => $this->user,
                'shipment' => $this->data['shipment'] ?? null,
                'traveler' => $this->data['traveler'] ?? null,
            ],
        );
    }
}
