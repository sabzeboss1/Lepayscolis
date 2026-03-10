<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ReleaseEscrowPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Payment $payment
    ) {}

    /**
     * Execute the job.
     * Release escrowed payment to traveler 7 days after delivery.
     * Requirements: 7.7-7.10
     */
    public function handle(PaymentService $paymentService): void
    {
        try {
            // Verify payment is still in escrowed status
            if ($this->payment->status !== 'escrowed') {
                Log::warning('Payment release skipped - payment not in escrowed status', [
                    'payment_id' => $this->payment->id,
                    'current_status' => $this->payment->status,
                ]);
                return;
            }

            // Verify shipment is still in delivered status
            $this->payment->refresh();
            if ($this->payment->shipment->status !== 'delivered') {
                Log::warning('Payment release skipped - shipment not in delivered status', [
                    'payment_id' => $this->payment->id,
                    'shipment_id' => $this->payment->shipment_id,
                    'shipment_status' => $this->payment->shipment->status,
                ]);
                return;
            }

            // Release payment to traveler
            $paymentService->releasePayment($this->payment);

            Log::info('Escrow payment released successfully', [
                'payment_id' => $this->payment->id,
                'shipment_id' => $this->payment->shipment_id,
                'traveler_amount' => $this->payment->traveler_amount,
                'payee_id' => $this->payment->payee_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to release escrow payment', [
                'payment_id' => $this->payment->id,
                'shipment_id' => $this->payment->shipment_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('ReleaseEscrowPayment job failed after all retries', [
            'payment_id' => $this->payment->id,
            'shipment_id' => $this->payment->shipment_id,
            'error' => $exception->getMessage(),
        ]);

        // In production, you would want to:
        // 1. Notify admin about the failure
        // 2. Create a manual review task
        // 3. Send notification to traveler about the delay
    }
}
