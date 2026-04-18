<?php

namespace App\Events;

use App\Models\ShipmentBid;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ShipmentBidRejected implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ShipmentBid $bid;

    /**
     * Create a new event instance.
     */
    public function __construct(ShipmentBid $bid)
    {
        $this->bid = $bid;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->bid->traveler_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'shipment-bid.rejected';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'bid_id' => $this->bid->id,
            'shipment_request_id' => $this->bid->shipment_request_id,
            'status' => $this->bid->status,
        ];
    }
}
