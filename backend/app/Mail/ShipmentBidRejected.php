<?php

namespace App\Mail;

use App\Models\ShipmentBid;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShipmentBidRejected extends Mailable
{
    use Queueable, SerializesModels;

    public ShipmentBid $bid;

    /**
     * Create a new message instance.
     */
    public function __construct(ShipmentBid $bid)
    {
        $this->bid = $bid;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Mise à jour de votre soumission',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.shipment-bid-rejected',
            with: [
                'bid' => $this->bid,
                'shipmentRequest' => $this->bid->shipmentRequest,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
