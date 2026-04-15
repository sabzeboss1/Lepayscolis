<?php

namespace App\Observers;

use App\Events\ShipmentBidAccepted;
use App\Events\ShipmentBidRejected;
use App\Events\ShipmentBidSubmitted;
use App\Models\ShipmentBid;

class ShipmentBidObserver
{
    /**
     * Handle the ShipmentBid "created" event.
     */
    public function created(ShipmentBid $bid): void
    {
        // Dispatch event when a new bid is submitted
        event(new ShipmentBidSubmitted($bid));
    }

    /**
     * Handle the ShipmentBid "updated" event.
     */
    public function updated(ShipmentBid $bid): void
    {
        // Check if status changed
        if ($bid->wasChanged('status')) {
            if ($bid->status === 'accepted') {
                event(new ShipmentBidAccepted($bid));
            } elseif ($bid->status === 'rejected') {
                event(new ShipmentBidRejected($bid));
            }
        }
    }
}
