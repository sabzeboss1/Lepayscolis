<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\Shipment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\Refund;
use Stripe\Stripe;
use Stripe\Transfer;

class PaymentService
{
    public function __construct(
        private CurrencyService $currencyService
    ) {
        // Configure Stripe API key from .env
        Stripe::setApiKey(config('stripe.secret'));
    }

    /**
     * Create a Stripe PaymentIntent and Payment record for a shipment.
     *
     * @param Shipment $shipment
     * @return Payment
     * @throws ApiErrorException
     */
    public function createPaymentIntent(Shipment $shipment): Payment
    {
        // Calculate fees using double commission model
        $baseAmount = $shipment->payment_amount;
        $currencyCode = $shipment->trip->currency_code ?? config('stripe.currency', 'eur');
        $fees = PlatformSetting::calculateFees($baseAmount);

        // Create Stripe PaymentIntent — charge sender the full amount (base + sender_fee)
        $paymentIntent = PaymentIntent::create([
            'amount' => $this->currencyService->getStripeAmount($fees['total_sender_pays'], $currencyCode),
            'currency' => strtolower($currencyCode),
            'metadata' => [
                'shipment_id' => $shipment->id,
                'sender_id' => $shipment->sender_id,
                'traveler_id' => $shipment->traveler_id,
                'currency_code' => $currencyCode,
            ],
            'description' => "Payment for shipment {$shipment->id}",
        ]);

        // Create Payment record — observer will compute fees from base_amount
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'base_amount' => $baseAmount,
            'currency_code' => strtoupper($currencyCode),
            'payment_method' => 'card',
            'transaction_id' => $paymentIntent->id,
            'status' => 'processing',
        ]);

        // Update shipment payment status
        $shipment->update(['payment_status' => 'processing']);

        Log::info('Payment intent created', [
            'payment_id' => $payment->id,
            'shipment_id' => $shipment->id,
            'base_amount' => $baseAmount,
            'total_charged' => $payment->amount,
            'sender_fee' => $payment->sender_fee,
            'traveler_fee' => $payment->traveler_fee,
            'transaction_id' => $paymentIntent->id,
        ]);

        return $payment;
    }

    /**
     * Process a successful PaymentIntent and update payment to escrowed status.
     *
     * @param Payment $payment
     * @return void
     */
    public function processEscrow(Payment $payment): void
    {
        // Update payment status to escrowed
        $payment->update([
            'status' => 'escrowed',
            'escrowed_at' => now(),
        ]);

        // Update shipment payment status
        $payment->shipment->update(['payment_status' => 'escrowed']);

        Log::info('Payment escrowed', [
            'payment_id' => $payment->id,
            'shipment_id' => $payment->shipment_id,
            'amount' => $payment->amount,
        ]);
    }

    /**
     * Release payment to traveler via Stripe Transfer.
     *
     * @param Payment $payment
     * @return void
     * @throws ApiErrorException
     */
    public function releasePayment(Payment $payment): void
    {
        // Credit traveler's wallet instead of direct Stripe transfer
        // This integrates with the wallet & withdrawals system
        
        try {
            DB::transaction(function () use ($payment) {
                // Use stored values from double commission model
                $travelerAmount = (float) $payment->traveler_amount;
                $paymentCurrency = $payment->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency();

                $wallet = $payment->payee->wallet;
                $walletCurrency = $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency();

                Log::info('Payment release initiated', [
                    'payment_id' => $payment->id,
                    'shipment_id' => $payment->shipment_id,
                    'base_amount' => $payment->base_amount,
                    'total_amount' => $payment->amount,
                    'sender_fee' => $payment->sender_fee,
                    'traveler_fee' => $payment->traveler_fee,
                    'platform_fee' => $payment->platform_fee,
                    'traveler_amount' => $travelerAmount,
                    'payment_currency' => $paymentCurrency,
                    'wallet_currency' => $walletCurrency,
                    'payee_id' => $payment->payee_id,
                ]);

                // Get WalletService instance
                $walletService = app(WalletService::class);

                // Handle cross-currency conversion if needed
                $creditAmount = $travelerAmount;
                $originalAmount = null;
                $originalCurrencyCode = null;
                $exchangeRateUsed = null;

                if ($paymentCurrency !== $walletCurrency) {
                    $conversion = $this->currencyService->convert(
                        $travelerAmount, $paymentCurrency, $walletCurrency
                    );
                    $creditAmount = $conversion['converted_amount'];
                    $originalAmount = $travelerAmount;
                    $originalCurrencyCode = $paymentCurrency;
                    $exchangeRateUsed = $conversion['exchange_rate'];

                    Log::info('Cross-currency conversion applied', [
                        'from' => $paymentCurrency,
                        'to' => $walletCurrency,
                        'original_amount' => $travelerAmount,
                        'converted_amount' => $creditAmount,
                        'exchange_rate' => $exchangeRateUsed,
                    ]);
                }

                // Credit traveler's wallet
                $walletService->credit(
                    $wallet,
                    $creditAmount,
                    "Payment for shipment {$payment->shipment_id}",
                    'shipment',
                    $payment->shipment_id,
                    $originalAmount,
                    $originalCurrencyCode,
                    $exchangeRateUsed
                );

                // Update payment status to released
                $payment->update([
                    'status' => 'released',
                    'released_at' => now(),
                ]);

                // Update shipment payment status
                $payment->shipment->update(['payment_status' => 'released']);

                Log::info('Payment released successfully to wallet', [
                    'payment_id' => $payment->id,
                    'shipment_id' => $payment->shipment_id,
                    'traveler_amount' => $creditAmount,
                    'wallet_id' => $wallet->id,
                ]);
            });
        } catch (\Exception $e) {
            Log::error('Payment release failed', [
                'payment_id' => $payment->id,
                'shipment_id' => $payment->shipment_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Refund a payment via Stripe Refund.
     *
     * @param Payment $payment
     * @return void
     * @throws ApiErrorException
     */
    public function refundPayment(Payment $payment): void
    {
        try {
            // Create Stripe Refund
            $refund = Refund::create([
                'payment_intent' => $payment->transaction_id,
                'metadata' => [
                    'payment_id' => $payment->id,
                    'shipment_id' => $payment->shipment_id,
                ],
            ]);

            // Update payment status to refunded
            $payment->update(['status' => 'refunded']);

            // Update shipment payment status
            $payment->shipment->update(['payment_status' => 'refunded']);

            Log::info('Payment refunded', [
                'payment_id' => $payment->id,
                'shipment_id' => $payment->shipment_id,
                'refund_id' => $refund->id,
                'amount' => $payment->amount,
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Payment refund failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle Stripe webhook events.
     *
     * @param array $event
     * @return void
     */
    public function handleWebhook(array $event): void
    {
        $eventType = $event['type'] ?? null;
        $eventData = $event['data']['object'] ?? null;

        if (!$eventType || !$eventData) {
            Log::warning('Invalid webhook event received', ['event' => $event]);
            return;
        }

        Log::info('Processing Stripe webhook', [
            'event_type' => $eventType,
            'event_id' => $event['id'] ?? null,
        ]);

        try {
            switch ($eventType) {
                case 'payment_intent.succeeded':
                    $this->handlePaymentIntentSucceeded($eventData);
                    break;

                case 'payment_intent.payment_failed':
                    $this->handlePaymentIntentFailed($eventData);
                    break;

                case 'transfer.created':
                    $this->handleTransferCreated($eventData);
                    break;

                case 'transfer.failed':
                    $this->handleTransferFailed($eventData);
                    break;

                case 'charge.refunded':
                    $this->handleChargeRefunded($eventData);
                    break;

                default:
                    Log::info('Unhandled webhook event type', ['event_type' => $eventType]);
            }
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle payment_intent.succeeded webhook event.
     *
     * @param array $paymentIntent
     * @return void
     */
    protected function handlePaymentIntentSucceeded(array $paymentIntent): void
    {
        $transactionId = $paymentIntent['id'] ?? null;

        if (!$transactionId) {
            Log::warning('Payment intent succeeded without ID');
            return;
        }

        $payment = Payment::where('transaction_id', $transactionId)->first();

        if (!$payment) {
            Log::warning('Payment not found for transaction', ['transaction_id' => $transactionId]);
            return;
        }

        if ($payment->status === 'processing') {
            $this->processEscrow($payment);
        }
    }

    /**
     * Handle payment_intent.payment_failed webhook event.
     *
     * @param array $paymentIntent
     * @return void
     */
    protected function handlePaymentIntentFailed(array $paymentIntent): void
    {
        $transactionId = $paymentIntent['id'] ?? null;

        if (!$transactionId) {
            Log::warning('Payment intent failed without ID');
            return;
        }

        $payment = Payment::with('shipment')->where('transaction_id', $transactionId)->first();

        if (!$payment) {
            Log::warning('Payment not found for transaction', ['transaction_id' => $transactionId]);
            return;
        }

        $payment->update(['status' => 'failed']);
        $payment->shipment->update(['payment_status' => 'failed']);

        Log::info('Payment marked as failed', [
            'payment_id' => $payment->id,
            'transaction_id' => $transactionId,
        ]);
    }

    /**
     * Handle transfer.created webhook event.
     *
     * @param array $transfer
     * @return void
     */
    protected function handleTransferCreated(array $transfer): void
    {
        Log::info('Transfer created', [
            'transfer_id' => $transfer['id'] ?? null,
            'amount' => $transfer['amount'] ?? null,
        ]);
    }

    /**
     * Handle transfer.failed webhook event.
     *
     * @param array $transfer
     * @return void
     */
    protected function handleTransferFailed(array $transfer): void
    {
        $transferId = $transfer['id'] ?? null;
        $failureMessage = $transfer['failure_message'] ?? 'Unknown error';
        $metadata = $transfer['metadata'] ?? [];
        $paymentId = $metadata['payment_id'] ?? null;

        Log::error('Transfer failed', [
            'transfer_id' => $transferId,
            'failure_message' => $failureMessage,
            'payment_id' => $paymentId,
        ]);

        // Find the payment associated with this transfer
        if ($paymentId) {
            $payment = Payment::find($paymentId);
            
            if ($payment) {
                // Update payment status to indicate transfer failure
                $payment->update(['status' => 'failed']);
                
                Log::error('Payment transfer failed - admin notification required', [
                    'payment_id' => $payment->id,
                    'shipment_id' => $payment->shipment_id,
                    'transfer_id' => $transferId,
                    'failure_message' => $failureMessage,
                ]);
                
                // TODO: Implement admin notification
                // This could be done via email, Slack, or other notification channels
                // For now, we're logging the error which should trigger monitoring alerts
            }
        }
    }

    /**
     * Handle charge.refunded webhook event.
     *
     * @param array $charge
     * @return void
     */
    protected function handleChargeRefunded(array $charge): void
    {
        $chargeId = $charge['id'] ?? null;
        $paymentIntentId = $charge['payment_intent'] ?? null;
        $refunded = $charge['refunded'] ?? false;
        $amountRefunded = $charge['amount_refunded'] ?? 0;

        Log::info('Charge refunded webhook received', [
            'charge_id' => $chargeId,
            'payment_intent_id' => $paymentIntentId,
            'refunded' => $refunded,
            'amount_refunded' => $amountRefunded,
        ]);

        if (!$paymentIntentId) {
            Log::warning('Charge refunded without payment intent ID');
            return;
        }

        // Find the payment by transaction_id (which is the PaymentIntent ID)
        $payment = Payment::where('transaction_id', $paymentIntentId)->first();

        if (!$payment) {
            Log::warning('Payment not found for refunded charge', [
                'payment_intent_id' => $paymentIntentId,
                'charge_id' => $chargeId,
            ]);
            return;
        }

        // Confirm refund is fully processed
        if ($refunded && $payment->status !== 'refunded') {
            $payment->update(['status' => 'refunded']);
            $payment->shipment->update(['payment_status' => 'refunded']);

            Log::info('Refund confirmed and processed', [
                'payment_id' => $payment->id,
                'shipment_id' => $payment->shipment_id,
                'charge_id' => $chargeId,
                'amount_refunded' => $amountRefunded / 100, // Convert from cents
            ]);
        } else {
            Log::info('Refund already processed or partial refund', [
                'payment_id' => $payment->id,
                'current_status' => $payment->status,
                'refunded' => $refunded,
            ]);
        }
    }
}
