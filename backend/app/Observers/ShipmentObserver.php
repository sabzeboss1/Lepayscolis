<?php

namespace App\Observers;

use App\Events\ShipmentCreated;
use App\Events\ShipmentStatusChanged;
use App\Models\Shipment;
use App\Models\Trip;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Log;

class ShipmentObserver
{
    /**
     * Handle the Shipment "creating" event.
     * Calculate payment_amount based on package_weight and trip price_per_kg.
     */
    public function creating(Shipment $shipment): void
    {
        // If trip_id is set, calculate payment_amount
        if ($shipment->trip_id) {
            $trip = Trip::find($shipment->trip_id);
            if ($trip) {
                $shipment->payment_amount = $shipment->package_weight * $trip->price_per_kg;
            }
        }
    }

    /**
     * Handle the Shipment "created" event.
     * Dispatch event to notify traveler.
     */
    public function created(Shipment $shipment): void
    {
        // Dispatch event when a new shipment is created
        event(new ShipmentCreated($shipment));
    }

    /**
     * Handle the Shipment "updating" event.
     * Validate status transitions before saving.
     */
    public function updating(Shipment $shipment): void
    {
        // Check if status is being changed
        if ($shipment->isDirty('status')) {
            $newStatus = $shipment->status;
            $oldStatus = $shipment->getOriginal('status');

            // Validate the transition
            if (!$this->isValidTransition($oldStatus, $newStatus, $shipment)) {
                throw new \InvalidArgumentException(
                    "Invalid status transition from '{$oldStatus}' to '{$newStatus}'"
                );
            }
        }

        // Recalculate payment_amount if trip_id or package_weight changes
        if ($shipment->isDirty('trip_id') || $shipment->isDirty('package_weight')) {
            if ($shipment->trip_id) {
                $trip = Trip::find($shipment->trip_id);
                if ($trip) {
                    $shipment->payment_amount = $shipment->package_weight * $trip->price_per_kg;
                }
            }
        }
    }

    /**
     * Handle the Shipment "updated" event.
     * Broadcast status changes via WebSocket.
     * Release held funds when shipment is cancelled.
     */
    public function updated(Shipment $shipment): void
    {
        // Broadcast status change if status was changed
        if ($shipment->wasChanged('status')) {
            $oldStatus = $shipment->getOriginal('status');
            $newStatus = $shipment->status;
            
            event(new ShipmentStatusChanged($shipment, $oldStatus, $newStatus));

            // Release held funds when shipment is cancelled
            if ($newStatus === 'cancelled') {
                $this->releaseHeldFunds($shipment);
            }
        }
    }

    /**
     * Validate if a status transition is allowed.
     */
    private function isValidTransition(string $oldStatus, string $newStatus, Shipment $shipment): bool
    {
        $allowedTransitions = [
            'pending' => ['accepted', 'cancelled'],
            'accepted' => ['in_transit', 'cancelled'],
            'in_transit' => ['delivered', 'cancelled'],
            'delivered' => [],
            'cancelled' => [],
        ];

        // Prevent cancellation if payment is already released
        if ($newStatus === 'cancelled' && $shipment->payment_status === 'released') {
            return false;
        }

        return in_array($newStatus, $allowedTransitions[$oldStatus] ?? []);
    }

    /**
     * Release held funds when shipment is cancelled.
     * Funds are returned to sender's available balance.
     */
    private function releaseHeldFunds(Shipment $shipment): void
    {
        try {
            // Only release if payment status is 'escrowed'
            if ($shipment->payment_status !== 'escrowed') {
                Log::info('No held funds to release - payment status not escrowed', [
                    'shipment_id' => $shipment->id,
                    'payment_status' => $shipment->payment_status,
                ]);
                return;
            }

            // Ensure sender relationship is loaded
            if (!$shipment->relationLoaded('sender')) {
                $shipment->load('sender.wallet');
            }

            $wallet = $shipment->sender->wallet;
            
            if (!$wallet) {
                Log::error('Cannot release held funds - sender wallet not found', [
                    'shipment_id' => $shipment->id,
                    'sender_id' => $shipment->sender_id,
                ]);
                return;
            }

            // Cancel hold and release funds
            $walletService = app(\App\Services\WalletService::class);
            $walletService->cancelHold(
                $wallet,
                $shipment->payment_amount,
                "Funds released - Shipment #{$shipment->id} cancelled",
                'shipment',
                $shipment->id
            );
            
            // Update shipment payment status
            $shipment->updateQuietly(['payment_status' => 'refunded']);

            Log::info('Held funds released for cancelled shipment', [
                'shipment_id' => $shipment->id,
                'amount' => $shipment->payment_amount,
                'sender_id' => $shipment->sender_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to release held funds for cancelled shipment', [
                'shipment_id' => $shipment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Don't throw exception to prevent shipment update from failing
            // The funds can be released manually if needed
        }
    }
}
