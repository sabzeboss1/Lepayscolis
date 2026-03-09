<?php

namespace App\Events;

use App\Models\Shipment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ShipmentStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Shipment $shipment,
        public string $oldStatus,
        public string $newStatus
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('user.' . $this->shipment->sender_id),
        ];

        // Also broadcast to traveler if assigned
        if ($this->shipment->traveler_id) {
            $channels[] = new PrivateChannel('user.' . $this->shipment->traveler_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'shipment.status.changed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'shipment_id' => $this->shipment->id,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'payment_status' => $this->shipment->payment_status,
            'updated_at' => $this->shipment->updated_at->toISOString(),
        ];
    }
}
