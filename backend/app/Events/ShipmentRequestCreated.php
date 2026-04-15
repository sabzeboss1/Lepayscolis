<?php

namespace App\Events;

use App\Models\ShipmentRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ShipmentRequestCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ShipmentRequest $shipmentRequest;

    /**
     * Create a new event instance.
     */
    public function __construct(ShipmentRequest $shipmentRequest)
    {
        $this->shipmentRequest = $shipmentRequest;
    }
}
