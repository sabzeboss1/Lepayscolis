<?php

namespace App\Events;

use App\Models\Shipment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ShipmentCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Shipment $shipment;

    /**
     * Create a new event instance.
     */
    public function __construct(Shipment $shipment)
    {
        $this->shipment = $shipment;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [];
        
        // Broadcast to the trip owner if trip is assigned
        if ($this->shipment->trip_id && $this->shipment->trip->traveler_id) {
            $channels[] = new PrivateChannel('user.' . $this->shipment->trip->traveler_id);
        }
        
        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'shipment.created';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'shipment_id' => $this->shipment->id,
            'sender' => [
                'id' => $this->shipment->sender->id,
                'name' => $this->shipment->sender->name,
            ],
            'package_weight' => $this->shipment->package_weight,
            'pickup_city' => $this->shipment->pickup_city,
            'delivery_city' => $this->shipment->delivery_city,
        ];
    }
}
