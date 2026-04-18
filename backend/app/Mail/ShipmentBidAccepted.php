<?php

namespace App\Mail;

use App\Models\ShipmentBid;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShipmentBidAccepted extends Mailable
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
            subject: 'Votre soumission a été acceptée !',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.shipment-bid-accepted',
            with: [
                'bid' => $this->bid,
                'shipmentRequest' => $this->bid->shipmentRequest,
                'sender' => $this->bid->shipmentRequest->sender,
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
