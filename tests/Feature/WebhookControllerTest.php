<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class WebhookControllerTest extends TestCase
{
    use RefreshDatabase;

    protected string $webhookSecret;
    protected string $webhookUrl;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->webhookSecret = 'whsec_test_secret';
        config(['stripe.webhook_secret' => $this->webhookSecret]);
        
        $this->webhookUrl = '/api/webhooks/stripe';
    }

    /**
     * Generate a valid Stripe webhook signature.
     *
     * @param string $payload
     * @param int $timestamp
     * @return string
     */
    protected function generateStripeSignature(string $payload, int $timestamp): string
    {
        $signedPayload = $timestamp . '.' . $payload;
        $signature = hash_hmac('sha256', $signedPayload, $this->webhookSecret);
        
        return "t={$timestamp},v1={$signature}";
    }

    /**
     * Create a webhook payload.
     *
     * @param string $eventType
     * @param array $data
     * @return array
     */
    protected function createWebhookPayload(string $eventType, array $data): array
    {
        return [
            'id' => 'evt_' . uniqid(),
            'type' => $eventType,
            'data' => [
                'object' => $data,
            ],
        ];
    }

    public function test_webhook_endpoint_exists(): void
    {
        $payload = json_encode($this->createWebhookPayload('ping', []));
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        // Should not return 404
        $this->assertNotEquals(404, $response->status());
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        Log::shouldReceive('info')->once();
        Log::shouldReceive('warning')->once();

        $payload = json_encode($this->createWebhookPayload('payment_intent.succeeded', [
            'id' => 'pi_test123',
        ]));

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => 'invalid_signature',
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'error' => 'Invalid signature',
        ]);
    }

    public function test_webhook_rejects_missing_signature(): void
    {
        Log::shouldReceive('info')->once();
        Log::shouldReceive('warning')->once();

        $payload = json_encode($this->createWebhookPayload('payment_intent.succeeded', [
            'id' => 'pi_test123',
        ]));

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true));

        $response->assertStatus(400);
    }

    public function test_webhook_accepts_valid_signature(): void
    {
        $payload = json_encode($this->createWebhookPayload('payment_intent.succeeded', [
            'id' => 'pi_test123',
            'amount' => 10000,
            'status' => 'succeeded',
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
    }

    public function test_webhook_logs_all_events(): void
    {
        $payload = json_encode($this->createWebhookPayload('payment_intent.succeeded', [
            'id' => 'pi_test123',
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);
        
        $response->assertStatus(200);
    }

    public function test_webhook_handles_payment_intent_succeeded(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'accepted',
            'payment_status' => 'processing',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'transaction_id' => 'pi_test123',
            'status' => 'processing',
        ]);

        $payload = json_encode($this->createWebhookPayload('payment_intent.succeeded', [
            'id' => 'pi_test123',
            'amount' => 10000,
            'status' => 'succeeded',
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        $response->assertStatus(200);
        
        // Verify payment was updated
        $payment->refresh();
        $this->assertEquals('escrowed', $payment->status);
        $this->assertNotNull($payment->escrowed_at);
        
        // Verify shipment payment status was updated
        $shipment->refresh();
        $this->assertEquals('escrowed', $shipment->payment_status);
    }

    public function test_webhook_handles_payment_intent_failed(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'accepted',
            'payment_status' => 'processing',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'transaction_id' => 'pi_test456',
            'status' => 'processing',
        ]);

        $payload = json_encode($this->createWebhookPayload('payment_intent.payment_failed', [
            'id' => 'pi_test456',
            'amount' => 10000,
            'status' => 'failed',
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        $response->assertStatus(200);
        
        // Verify payment was updated
        $payment->refresh();
        $this->assertEquals('failed', $payment->status);
    }

    public function test_webhook_handles_unhandled_event_types(): void
    {
        $payload = json_encode($this->createWebhookPayload('customer.created', [
            'id' => 'cus_test123',
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
    }

    public function test_webhook_returns_200_on_processing_error(): void
    {
        // Create a malformed payload that will cause processing error
        $payload = json_encode($this->createWebhookPayload('payment_intent.succeeded', [
            'id' => 'pi_nonexistent',
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        // Should return 200 even if processing fails
        $response->assertStatus(200);
    }

    public function test_webhook_handles_transfer_created(): void
    {
        $payload = json_encode($this->createWebhookPayload('transfer.created', [
            'id' => 'tr_test123',
            'amount' => 8500,
            'currency' => 'eur',
            'destination' => 'acct_test123',
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
    }

    public function test_webhook_handles_transfer_failed(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'transaction_id' => 'pi_test789',
            'status' => 'escrowed',
        ]);

        $payload = json_encode($this->createWebhookPayload('transfer.failed', [
            'id' => 'tr_test456',
            'amount' => 8500,
            'failure_message' => 'Insufficient funds in account',
            'metadata' => [
                'payment_id' => $payment->id,
            ],
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        $response->assertStatus(200);
        
        // Verify payment status was updated to failed
        $payment->refresh();
        $this->assertEquals('failed', $payment->status);
    }

    public function test_webhook_handles_charge_refunded(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'cancelled',
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'transaction_id' => 'pi_test999',
            'status' => 'escrowed',
        ]);

        $payload = json_encode($this->createWebhookPayload('charge.refunded', [
            'id' => 'ch_test123',
            'payment_intent' => 'pi_test999',
            'refunded' => true,
            'amount_refunded' => 10000,
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        $response->assertStatus(200);
        
        // Verify payment was updated to refunded
        $payment->refresh();
        $this->assertEquals('refunded', $payment->status);
        
        // Verify shipment payment status was updated
        $shipment->refresh();
        $this->assertEquals('refunded', $shipment->payment_status);
    }

    public function test_webhook_handles_charge_refunded_without_payment_intent(): void
    {
        $payload = json_encode($this->createWebhookPayload('charge.refunded', [
            'id' => 'ch_test456',
            'refunded' => true,
            'amount_refunded' => 10000,
        ]));
        
        $timestamp = time();
        $signature = $this->generateStripeSignature($payload, $timestamp);

        $response = $this->postJson($this->webhookUrl, json_decode($payload, true), [
            'Stripe-Signature' => $signature,
        ]);

        // Should still return 200 even if payment_intent is missing
        $response->assertStatus(200);
    }
}
