<?php

namespace App\Observers;

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
     * Create payment when shipment is accepted.
     * Queue payment release when shipment is delivered.
     * Refund payment when shipment is cancelled with escrowed payment.
     */
    public function updated(Shipment $shipment): void
    {
        // Broadcast status change if status was changed
        if ($shipment->wasChanged('status')) {
            $oldStatus = $shipment->getOriginal('status');
            $newStatus = $shipment->status;
            
            event(new ShipmentStatusChanged($shipment, $oldStatus, $newStatus));

            // Create payment when shipment is accepted
            if ($newStatus === 'accepted') {
                $this->createPaymentForAcceptedShipment($shipment);
            }

            // Queue payment release when shipment is delivered
            // Requirements: 7.7
            if ($newStatus === 'delivered') {
                $this->queuePaymentRelease($shipment);
            }

            // Refund payment when shipment is cancelled with escrowed payment
            // Requirements: 7.11-7.13
            if ($newStatus === 'cancelled') {
                $this->refundPaymentIfEscrowed($shipment);
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
     * Create payment for accepted shipment.
     * Requirements: 7.1-7.4
     */
    private function createPaymentForAcceptedShipment(Shipment $shipment): void
    {
        try {
            // Ensure shipment has required data
            if (!$shipment->traveler_id || !$shipment->payment_amount) {
                Log::warning('Cannot create payment for shipment without traveler or payment amount', [
                    'shipment_id' => $shipment->id,
                    'traveler_id' => $shipment->traveler_id,
                    'payment_amount' => $shipment->payment_amount,
                ]);
                return;
            }

            // Check if payment already exists
            if ($shipment->payment()->exists()) {
                Log::info('Payment already exists for shipment', [
                    'shipment_id' => $shipment->id,
                ]);
                return;
            }

            // Create payment using PaymentService
            $paymentService = app(PaymentService::class);
            $payment = $paymentService->createPaymentIntent($shipment);

            Log::info('Payment created for accepted shipment', [
                'shipment_id' => $shipment->id,
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'platform_fee' => $payment->platform_fee,
                'traveler_amount' => $payment->traveler_amount,
                'status' => $payment->status,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create payment for accepted shipment', [
                'shipment_id' => $shipment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Don't throw exception to prevent shipment update from failing
            // The payment creation can be retried manually if needed
        }
    }

    /**
     * Queue payment release job with 7-day delay when shipment is delivered.
     * Requirements: 7.7
     */
    private function queuePaymentRelease(Shipment $shipment): void
    {
        try {
            // Ensure payment relationship is loaded
            if (!$shipment->relationLoaded('payment')) {
                $shipment->load('payment');
            }

            // Get the payment for this shipment
            $payment = $shipment->payment;

            if (!$payment) {
                Log::warning('Cannot queue payment release - no payment found for shipment', [
                    'shipment_id' => $shipment->id,
                ]);
                return;
            }

            // Only queue release if payment is in escrowed status
            if ($payment->status !== 'escrowed') {
                Log::warning('Cannot queue payment release - payment not in escrowed status', [
                    'shipment_id' => $shipment->id,
                    'payment_id' => $payment->id,
                    'payment_status' => $payment->status,
                ]);
                return;
            }

            // Queue the ReleaseEscrowPayment job with 7-day delay
            \App\Jobs\ReleaseEscrowPayment::dispatch($payment)
                ->delay(now()->addDays(7));

            Log::info('Payment release job queued with 7-day delay', [
                'shipment_id' => $shipment->id,
                'payment_id' => $payment->id,
                'scheduled_for' => now()->addDays(7)->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue payment release job', [
                'shipment_id' => $shipment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Don't throw exception to prevent shipment update from failing
            // The job can be queued manually if needed
        }
    }

    /**
     * Refund payment when shipment is cancelled with escrowed payment.
     * Requirements: 7.11-7.13
     */
    private function refundPaymentIfEscrowed(Shipment $shipment): void
    {
        try {
            // Ensure payment relationship is loaded
            if (!$shipment->relationLoaded('payment')) {
                $shipment->load('payment');
            }

            // Get the payment for this shipment
            $payment = $shipment->payment;

            if (!$payment) {
                Log::info('No payment to refund - no payment found for cancelled shipment', [
                    'shipment_id' => $shipment->id,
                ]);
                return;
            }

            // Only refund if payment is in escrowed status
            if ($payment->status !== 'escrowed') {
                Log::info('No refund needed - payment not in escrowed status', [
                    'shipment_id' => $shipment->id,
                    'payment_id' => $payment->id,
                    'payment_status' => $payment->status,
                ]);
                return;
            }

            // Check if shipment payment_status is escrowed
            if ($shipment->payment_status !== 'escrowed') {
                Log::warning('Payment status mismatch - shipment payment_status not escrowed', [
                    'shipment_id' => $shipment->id,
                    'payment_id' => $payment->id,
                    'shipment_payment_status' => $shipment->payment_status,
                    'payment_status' => $payment->status,
                ]);
                return;
            }

            // Refund the payment using PaymentService
            $paymentService = app(PaymentService::class);
            $paymentService->refundPayment($payment);

            Log::info('Payment refunded for cancelled shipment', [
                'shipment_id' => $shipment->id,
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to refund payment for cancelled shipment', [
                'shipment_id' => $shipment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Don't throw exception to prevent shipment update from failing
            // The refund can be processed manually if needed
        }
    }
}
