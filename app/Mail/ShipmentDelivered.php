<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ShipmentDelivered extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('shipment_delivered'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('shipment-delivered'),
            with: [
                'user' => $this->user,
                'shipment' => $this->data['shipment'] ?? null,
            ],
        );
    }
}
