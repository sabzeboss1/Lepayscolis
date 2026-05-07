<?php

namespace App\Mail;

use App\Models\ShipmentBid;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\PlatformSetting;

class ShipmentBidSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public ShipmentBid $bid;
    public string $platformName;

    /**
     * Create a new message instance.
     */
    public function __construct(ShipmentBid $bid)
    {
        $this->bid = $bid;
        $this->platformName = PlatformSetting::get('platform_name', 'TumaPlus');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nouvelle soumission pour votre expédition',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.shipment-bid-submitted',
            with: [
                'bid' => $this->bid,
                'shipmentRequest' => $this->bid->shipmentRequest,
                'traveler' => $this->bid->traveler,
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
