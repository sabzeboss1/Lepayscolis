<?php

namespace App\Listeners;

use App\Events\ShipmentCreated;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyTravelerOfNewShipment implements ShouldQueue
{
    use InteractsWithQueue;

    protected NotificationService $notificationService;

    /**
     * Create the event listener.
     */
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the event.
     */
    public function handle(ShipmentCreated $event): void
    {
        $shipment = $event->shipment;

        // If shipment has a trip assigned, notify the trip owner
        if ($shipment->trip_id && $shipment->trip->traveler_id) {
            $traveler = $shipment->trip->traveler;
            $this->notificationService->sendNewShipmentNotification($shipment, $traveler);
        }
    }
}
