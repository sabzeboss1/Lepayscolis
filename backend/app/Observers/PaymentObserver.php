<?php

namespace App\Observers;

use App\Events\PaymentStatusChanged;
use App\Models\Payment;
use App\Models\PlatformSetting;

class PaymentObserver
{
    /**
     * Handle the Payment "creating" event.
     * Calculate fees using PlatformSetting double commission model.
     */
    public function creating(Payment $payment): void
    {
        // If base_amount is set, calculate fees from it using PlatformSetting
        if ($payment->base_amount > 0) {
            $fees = PlatformSetting::calculateFees($payment->base_amount);
            $payment->sender_fee = $fees['sender_fee'];
            $payment->traveler_fee = $fees['traveler_fee'];
            $payment->amount = $fees['total_sender_pays'];
            $payment->platform_fee = $fees['platform_revenue'];
            $payment->traveler_amount = $fees['traveler_receives'];
        }
    }

    /**
     * Handle the Payment "updated" event.
     * Broadcast status changes via WebSocket.
     */
    public function updated(Payment $payment): void
    {
        // Broadcast status change if status was changed
        if ($payment->wasChanged('status')) {
            $oldStatus = $payment->getOriginal('status');
            $newStatus = $payment->status;
            
            event(new PaymentStatusChanged($payment, $oldStatus, $newStatus));
        }
    }
}
