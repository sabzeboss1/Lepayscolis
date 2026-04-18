<?php

namespace App\Services;

use App\Jobs\SendEmailNotification;
use App\Jobs\SendPushNotification;
use App\Models\Notification;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send an email notification to a user.
     * Queues the email for async processing with user's locale.
     */
    public function sendEmail(User $user, string $template, array $data): void
    {
        try {
            SendEmailNotification::dispatch($user, $template, $data);
            
            Log::info('Email notification queued', [
                'user_id' => $user->id,
                'template' => $template,
                'locale' => $user->locale,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue email notification', [
                'user_id' => $user->id,
                'template' => $template,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send a push notification to a user via FCM.
     * Queues the push notification for async processing.
     */
    public function sendPush(User $user, string $title, string $body, array $data = []): void
    {
        // Only send if user has FCM token
        if (!$user->fcm_token) {
            Log::info('Push notification skipped - no FCM token', [
                'user_id' => $user->id,
            ]);
            return;
        }

        try {
            SendPushNotification::dispatch($user, $title, $body, $data);
            
            Log::info('Push notification queued', [
                'user_id' => $user->id,
                'title' => $title,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue push notification', [
                'user_id' => $user->id,
                'title' => $title,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Broadcast a WebSocket event via Pusher.
     * This is handled by Laravel's event broadcasting system.
     */
    public function broadcast(string $channel, string $event, array $data): void
    {
        try {
            broadcast(new \Illuminate\Broadcasting\BroadcastEvent($channel, $event, $data));
            
            Log::info('WebSocket event broadcast', [
                'channel' => $channel,
                'event' => $event,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast WebSocket event', [
                'channel' => $channel,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Create a notification record in the database.
     * Stores notification for in-app display.
     */
    public function createNotification(User $user, string $type, string $title, string $body, array $data = []): Notification
    {
        try {
            $notification = Notification::create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'data' => $data,
            ]);

            Log::info('Notification created', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'type' => $type,
            ]);

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Notify traveler that their trip has been verified.
     */
    public function sendTripVerifiedNotification(Trip $trip): void
    {
        $traveler = $trip->traveler;
        $locale = $traveler->locale ?? 'fr';

        $title = __('notifications.trip_verified.title', [], $locale);
        $body = __('notifications.trip_verified.body', [
            'departure' => $trip->departure_city,
            'arrival' => $trip->arrival_city,
        ], $locale);

        $this->createNotification($traveler, 'trip_verified', $title, $body, [
            'trip_id' => $trip->id,
        ]);

        $this->sendPush($traveler, $title, $body, [
            'type' => 'trip_verified',
            'trip_id' => $trip->id,
        ]);
    }

    /**
     * Notify traveler that their trip has been rejected.
     */
    public function sendTripRejectedNotification(Trip $trip, string $reason): void
    {
        $traveler = $trip->traveler;
        $locale = $traveler->locale ?? 'fr';

        $title = __('notifications.trip_rejected.title', [], $locale);
        $body = __('notifications.trip_rejected.body', [
            'departure' => $trip->departure_city,
            'arrival' => $trip->arrival_city,
            'reason' => $reason,
        ], $locale);

        $this->createNotification($traveler, 'trip_rejected', $title, $body, [
            'trip_id' => $trip->id,
            'reason' => $reason,
        ]);

        $this->sendPush($traveler, $title, $body, [
            'type' => 'trip_rejected',
            'trip_id' => $trip->id,
        ]);
    }

    /**
     * Notify traveler that their trip has been cancelled by admin.
     */
    public function sendTripCancelledNotification(Trip $trip, string $reason): void
    {
        $traveler = $trip->traveler;
        $locale = $traveler->locale ?? 'fr';

        $title = __('notifications.trip_cancelled.title', [], $locale);
        $body = __('notifications.trip_cancelled.body', [
            'departure' => $trip->departure_city,
            'arrival' => $trip->arrival_city,
            'reason' => $reason,
        ], $locale);

        $this->createNotification($traveler, 'trip_cancelled', $title, $body, [
            'trip_id' => $trip->id,
            'reason' => $reason,
        ]);

        $this->sendPush($traveler, $title, $body, [
            'type' => 'trip_cancelled',
            'trip_id' => $trip->id,
        ]);
    }

    /**
     * Notify sender that their shipment has been cancelled.
     */
    public function sendShipmentCancelledNotification($shipment, string $reason): void
    {
        $sender = $shipment->sender;
        $locale = $sender->locale ?? 'fr';

        $title = __('notifications.shipment_cancelled.title', [], $locale);
        $body = __('notifications.shipment_cancelled.body', [
            'reason' => $reason,
        ], $locale);

        $this->createNotification($sender, 'shipment_cancelled', $title, $body, [
            'shipment_id' => $shipment->id,
            'reason' => $reason,
        ]);

        $this->sendPush($sender, $title, $body, [
            'type' => 'shipment_cancelled',
            'shipment_id' => $shipment->id,
        ]);
    }

    /**
     * Notify user that their KYC has been approved.
     */
    public function sendKYCApprovedNotification(User $user): void
    {
        $locale = $user->locale ?? 'fr';

        $title = __('notifications.kyc_approved', [], $locale);
        $body = __('notifications.kyc_approved_body', [], $locale);

        $this->createNotification($user, 'kyc_approved', $title, $body);

        $this->sendPush($user, $title, $body, [
            'type' => 'kyc_approved',
        ]);
    }

    /**
     * Notify user that their KYC has been rejected.
     */
    public function sendKYCRejectedNotification(User $user, string $reason): void
    {
        $locale = $user->locale ?? 'fr';

        $title = __('notifications.kyc_rejected', [], $locale);
        $body = __('notifications.kyc_rejected_body', ['reason' => $reason], $locale);

        $this->createNotification($user, 'kyc_rejected', $title, $body, [
            'reason' => $reason,
        ]);

        $this->sendPush($user, $title, $body, [
            'type' => 'kyc_rejected',
        ]);
    }

    /**
     * Notify sender that a new bid has been submitted on their shipment request.
     */
    public function sendBidSubmittedNotification($bid, User $sender): void
    {
        $locale = $sender->locale ?? 'fr';

        $title = $locale === 'fr' 
            ? 'Nouvelle soumission reçue' 
            : 'New bid received';
        
        $body = $locale === 'fr'
            ? sprintf(
                '%s a soumissionné %s %s pour votre expédition "%s"',
                $bid->traveler->name,
                $bid->proposed_price,
                $bid->currency_code,
                $bid->shipmentRequest->title
            )
            : sprintf(
                '%s bid %s %s for your shipment "%s"',
                $bid->traveler->name,
                $bid->proposed_price,
                $bid->currency_code,
                $bid->shipmentRequest->title
            );

        $this->createNotification($sender, 'bid_submitted', $title, $body, [
            'bid_id' => $bid->id,
            'shipment_request_id' => $bid->shipment_request_id,
            'traveler_id' => $bid->traveler_id,
        ]);

        $this->sendPush($sender, $title, $body, [
            'type' => 'bid_submitted',
            'bid_id' => $bid->id,
            'shipment_request_id' => $bid->shipment_request_id,
        ]);
    }

    /**
     * Notify traveler that their bid has been accepted.
     */
    public function sendBidAcceptedNotification($bid, User $traveler): void
    {
        $locale = $traveler->locale ?? 'fr';

        $title = $locale === 'fr' 
            ? 'Soumission acceptée' 
            : 'Bid accepted';
        
        $body = $locale === 'fr'
            ? sprintf(
                'Votre soumission pour "%s" a été acceptée ! Contactez l\'expéditeur pour organiser la livraison.',
                $bid->shipmentRequest->title
            )
            : sprintf(
                'Your bid for "%s" has been accepted! Contact the sender to arrange delivery.',
                $bid->shipmentRequest->title
            );

        $this->createNotification($traveler, 'bid_accepted', $title, $body, [
            'bid_id' => $bid->id,
            'shipment_request_id' => $bid->shipment_request_id,
        ]);

        $this->sendPush($traveler, $title, $body, [
            'type' => 'bid_accepted',
            'bid_id' => $bid->id,
            'shipment_request_id' => $bid->shipment_request_id,
        ]);
    }

    /**
     * Notify traveler that their bid has been rejected.
     */
    public function sendBidRejectedNotification($bid, User $traveler): void
    {
        $locale = $traveler->locale ?? 'fr';

        $title = $locale === 'fr' 
            ? 'Soumission refusée' 
            : 'Bid rejected';
        
        $body = $locale === 'fr'
            ? sprintf(
                'Votre soumission pour "%s" n\'a pas été retenue. L\'expéditeur a choisi un autre voyageur.',
                $bid->shipmentRequest->title
            )
            : sprintf(
                'Your bid for "%s" was not selected. The sender chose another traveler.',
                $bid->shipmentRequest->title
            );

        $this->createNotification($traveler, 'bid_rejected', $title, $body, [
            'bid_id' => $bid->id,
            'shipment_request_id' => $bid->shipment_request_id,
        ]);

        $this->sendPush($traveler, $title, $body, [
            'type' => 'bid_rejected',
            'bid_id' => $bid->id,
            'shipment_request_id' => $bid->shipment_request_id,
        ]);
    }

    /**
     * Notify travelers of a new shipment request matching their route.
     */
    public function sendNewShipmentRequestNotification($shipmentRequest, User $traveler): void
    {
        $locale = $traveler->locale ?? 'fr';

        $title = $locale === 'fr' 
            ? 'Nouvelle expédition disponible' 
            : 'New shipment available';
        
        $body = $locale === 'fr'
            ? sprintf(
                'Une nouvelle expédition de %s à %s correspond à votre trajet. Budget: %s %s',
                $shipmentRequest->pickupCity->name ?? $shipmentRequest->pickupCountry->name,
                $shipmentRequest->deliveryCity->name ?? $shipmentRequest->deliveryCountry->name,
                $shipmentRequest->max_budget ?? 'À négocier',
                $shipmentRequest->currency_code
            )
            : sprintf(
                'A new shipment from %s to %s matches your route. Budget: %s %s',
                $shipmentRequest->pickupCity->name ?? $shipmentRequest->pickupCountry->name,
                $shipmentRequest->deliveryCity->name ?? $shipmentRequest->deliveryCountry->name,
                $shipmentRequest->max_budget ?? 'Negotiable',
                $shipmentRequest->currency_code
            );

        $this->createNotification($traveler, 'new_shipment_request', $title, $body, [
            'shipment_request_id' => $shipmentRequest->id,
            'pickup_country' => $shipmentRequest->pickupCountry->name,
            'delivery_country' => $shipmentRequest->deliveryCountry->name,
        ]);

        $this->sendPush($traveler, $title, $body, [
            'type' => 'new_shipment_request',
            'shipment_request_id' => $shipmentRequest->id,
        ]);
    }

    /**
     * Notify traveler of a new shipment submission on their trip.
     */
    public function sendNewShipmentNotification($shipment, User $traveler): void
    {
        $locale = $traveler->locale ?? 'fr';

        $title = $locale === 'fr' 
            ? 'Nouvelle demande d\'expédition' 
            : 'New shipment request';
        
        $body = $locale === 'fr'
            ? sprintf(
                '%s souhaite envoyer un colis de %s kg de %s à %s',
                $shipment->sender->name,
                $shipment->package_weight,
                $shipment->pickup_city,
                $shipment->delivery_city
            )
            : sprintf(
                '%s wants to send a %s kg package from %s to %s',
                $shipment->sender->name,
                $shipment->package_weight,
                $shipment->pickup_city,
                $shipment->delivery_city
            );

        $this->createNotification($traveler, 'new_shipment', $title, $body, [
            'shipment_id' => $shipment->id,
            'sender_id' => $shipment->sender_id,
            'trip_id' => $shipment->trip_id,
        ]);

        $this->sendPush($traveler, $title, $body, [
            'type' => 'new_shipment',
            'shipment_id' => $shipment->id,
        ]);
    }
}
