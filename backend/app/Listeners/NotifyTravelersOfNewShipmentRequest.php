<?php

namespace App\Listeners;

use App\Events\ShipmentRequestCreated;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyTravelersOfNewShipmentRequest implements ShouldQueue
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
    public function handle(ShipmentRequestCreated $event): void
    {
        $shipmentRequest = $event->shipmentRequest;

        // Only notify if the shipment request is verified
        if ($shipmentRequest->verification_status !== 'verified') {
            return;
        }

        // Find travelers who have trips matching the route
        $travelers = User::whereHas('trips', function ($query) use ($shipmentRequest) {
            $query->where('departure_country_id', $shipmentRequest->pickup_country_id)
                  ->where('arrival_country_id', $shipmentRequest->delivery_country_id)
                  ->where('status', 'verified')
                  ->where('departure_date', '>=', now());
        })
        ->where('id', '!=', $shipmentRequest->sender_id) // Don't notify the sender
        ->where('kyc_status', 'approved') // Only notify verified travelers
        ->get();

        // Notify each traveler
        foreach ($travelers as $traveler) {
            $this->notificationService->sendNewShipmentRequestNotification($shipmentRequest, $traveler);
        }
    }
}
