<?php

namespace App\Observers;

use App\Events\PaymentStatusChanged;
use App\Models\Payment;

class PaymentObserver
{
    /**
     * Handle the Payment "creating" event.
     * Calculate platform_fee (15%) and traveler_amount (85%) before saving.
     */
    public function creating(Payment $payment): void
    {
        // Calculate platform fee (15%) and traveler amount (85%)
        $payment->platform_fee = $payment->amount * 0.15;
        $payment->traveler_amount = $payment->amount * 0.85;
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
