<?php

namespace App\Listeners;

use App\Events\ShipmentBidAccepted;
use App\Events\ShipmentBidRejected;
use App\Events\ShipmentBidSubmitted;
use App\Mail\ShipmentBidAccepted as ShipmentBidAcceptedMail;
use App\Mail\ShipmentBidRejected as ShipmentBidRejectedMail;
use App\Mail\ShipmentBidSubmitted as ShipmentBidSubmittedMail;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendShipmentBidNotification implements ShouldQueue
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
     * Handle ShipmentBidSubmitted event.
     */
    public function handleBidSubmitted(ShipmentBidSubmitted $event): void
    {
        $bid = $event->bid;
        $sender = $bid->shipmentRequest->sender;

        // Send in-app and push notification
        $this->notificationService->sendBidSubmittedNotification($bid, $sender);
        
        // Send email notification
        Mail::to($sender->email)->send(new ShipmentBidSubmittedMail($bid));
    }

    /**
     * Handle ShipmentBidAccepted event.
     */
    public function handleBidAccepted(ShipmentBidAccepted $event): void
    {
        $bid = $event->bid;
        $traveler = $bid->traveler;

        // Send in-app and push notification
        $this->notificationService->sendBidAcceptedNotification($bid, $traveler);
        
        // Send email notification
        Mail::to($traveler->email)->send(new ShipmentBidAcceptedMail($bid));
    }

    /**
     * Handle ShipmentBidRejected event.
     */
    public function handleBidRejected(ShipmentBidRejected $event): void
    {
        $bid = $event->bid;
        $traveler = $bid->traveler;

        // Send in-app and push notification
        $this->notificationService->sendBidRejectedNotification($bid, $traveler);
        
        // Send email notification
        Mail::to($traveler->email)->send(new ShipmentBidRejectedMail($bid));
    }
}
