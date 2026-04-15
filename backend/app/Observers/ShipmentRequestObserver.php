<?php

namespace App\Observers;

use App\Events\ShipmentRequestCreated;
use App\Models\ShipmentRequest;

class ShipmentRequestObserver
{
    /**
     * Handle the ShipmentRequest "created" event.
     */
    public function created(ShipmentRequest $shipmentRequest): void
    {
        // Dispatch event when a new shipment request is created
        event(new ShipmentRequestCreated($shipmentRequest));
    }
}
