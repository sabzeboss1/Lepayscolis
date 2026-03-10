<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ShipmentCreated extends BaseNotificationMail
{
    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('shipment_created'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: $this->getView('shipment-created'),
            with: [
                'user' => $this->user,
                'shipment' => $this->data['shipment'] ?? null,
            ],
        );
    }
}
