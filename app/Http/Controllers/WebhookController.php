<?php

namespace App\Http\Controllers;

use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class WebhookController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Handle incoming Stripe webhook events.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function handleStripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');
        $webhookSecret = config('stripe.webhook_secret');

        // Log the incoming webhook
        Log::info('Stripe webhook received', [
            'has_signature' => !empty($signature),
            'payload_length' => strlen($payload),
        ]);

        // Verify webhook signature
        try {
            $event = Webhook::constructEvent(
                $payload,
                $signature,
                $webhookSecret
            );
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
                'signature' => $signature,
            ]);

            return response()->json([
                'error' => 'Invalid signature',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Stripe webhook processing error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Webhook processing failed',
            ], 400);
        }

        // Log the verified event
        Log::info('Stripe webhook signature verified', [
            'event_id' => $event->id,
            'event_type' => $event->type,
        ]);

        // Process the webhook event
        try {
            $this->paymentService->handleWebhook($event->toArray());

            return response()->json([
                'success' => true,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Stripe webhook event processing failed', [
                'event_id' => $event->id,
                'event_type' => $event->type,
                'error' => $e->getMessage(),
            ]);

            // Return 200 to prevent Stripe from retrying
            // The error is logged for manual investigation
            return response()->json([
                'success' => false,
                'message' => 'Event logged for manual processing',
            ], 200);
        }
    }
}
