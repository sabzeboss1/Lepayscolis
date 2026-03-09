<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ShipmentInTransit extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('shipment_in_transit'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('shipment-in-transit'),
            with: [
                'user' => $this->user,
                'shipment' => $this->data['shipment'] ?? null,
            ],
        );
    }
}
