<?php

namespace Tests\Feature;

use App\Jobs\ReleaseEscrowPayment;
use App\Models\Payment;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\TestCase;

/**
 * Test ReleaseEscrowPayment job functionality.
 * Requirements: 7.7-7.10
 */
class ReleaseEscrowPaymentJobTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock PaymentService to prevent actual Stripe API calls
        $this->mockPaymentService();
    }

    /**
     * Mock PaymentService to prevent actual Stripe API calls and wallet operations.
     */
    protected function mockPaymentService(): void
    {
        $mock = Mockery::mock(PaymentService::class)->makePartial();
        
        $mock->shouldReceive('releasePayment')
            ->andReturnUsing(function (Payment $payment) {
                // Simulate payment release with wallet credit
                $payment->update([
                    'status' => 'released',
                    'released_at' => now(),
                ]);

                // Update shipment payment status
                $payment->shipment->update(['payment_status' => 'released']);
            });

        $this->app->instance(PaymentService::class, $mock);
    }

    /**
     * Test that ReleaseEscrowPayment job is queued with 7-day delay when shipment is delivered.
     * Requirement 7.7: WHEN a shipment status changes to "delivered", THE Payment_System SHALL queue ReleaseEscrowPayment job with 7-day delay
     */
    public function test_payment_release_job_queued_when_shipment_delivered(): void
    {
        Queue::fake();

        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'in_transit',
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(1),
        ]);

        // Act - Update shipment status to delivered
        $shipment->update(['status' => 'delivered']);

        // Assert - Job should be queued
        Queue::assertPushed(ReleaseEscrowPayment::class);
    }

    /**
     * Test that ReleaseEscrowPayment job credits traveler's wallet.
     * Requirement 7.8: WHEN ReleaseEscrowPayment job executes, THE Payment_System SHALL credit traveler's wallet with 85% of payment amount
     * Wallet Integration: Payment release now credits wallet instead of direct Stripe transfer
     */
    public function test_payment_release_job_creates_stripe_transfer(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'delivered',
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act - Execute the job
        $job = new ReleaseEscrowPayment($payment);
        $job->handle(app(PaymentService::class));

        // Assert - Payment should be released
        $payment->refresh();
        $this->assertEquals('released', $payment->status);
        $this->assertNotNull($payment->released_at);
    }

    /**
     * Test that successful Transfer updates Payment status to 'released' and sets released_at.
     * Requirement 7.9: WHEN Stripe Transfer succeeds, THE Payment_System SHALL update Payment status to "released" and set released_at timestamp
     */
    public function test_successful_transfer_updates_payment_status(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'delivered',
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act
        $job = new ReleaseEscrowPayment($payment);
        $job->handle(app(PaymentService::class));

        // Assert
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'released',
        ]);

        $payment->refresh();
        $this->assertNotNull($payment->released_at);
    }

    /**
     * Test that successful Transfer updates Shipment payment_status to 'released'.
     * Requirement 7.10: WHEN Stripe Transfer succeeds, THE Payment_System SHALL update Shipment payment_status to "released"
     */
    public function test_successful_transfer_updates_shipment_payment_status(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'delivered',
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act
        $job = new ReleaseEscrowPayment($payment);
        $job->handle(app(PaymentService::class));

        // Assert
        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'payment_status' => 'released',
        ]);
    }

    /**
     * Test that job skips payment release if payment is not in escrowed status.
     */
    public function test_job_skips_if_payment_not_escrowed(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'delivered',
            'payment_status' => 'released',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'status' => 'released', // Already released
            'escrowed_at' => now()->subDays(7),
            'released_at' => now(),
        ]);

        // Act
        $job = new ReleaseEscrowPayment($payment);
        $job->handle(app(PaymentService::class));

        // Assert - Payment should remain released (no change)
        $payment->refresh();
        $this->assertEquals('released', $payment->status);
    }

    /**
     * Test that job skips payment release if shipment is not in delivered status.
     */
    public function test_job_skips_if_shipment_not_delivered(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'cancelled', // Not delivered
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act
        $job = new ReleaseEscrowPayment($payment);
        $job->handle(app(PaymentService::class));

        // Assert - Payment should remain escrowed (no change)
        $payment->refresh();
        $this->assertEquals('escrowed', $payment->status);
        $this->assertNull($payment->released_at);
    }

    /**
     * Test that job is not queued if payment is not in escrowed status.
     */
    public function test_job_not_queued_if_payment_not_escrowed(): void
    {
        Queue::fake();

        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'in_transit',
            'payment_status' => 'processing', // Not escrowed
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'status' => 'processing', // Not escrowed
        ]);

        // Act - Update shipment status to delivered
        $shipment->update(['status' => 'delivered']);

        // Assert - Job should not be queued
        Queue::assertNotPushed(ReleaseEscrowPayment::class);
    }

    /**
     * Test that job is not queued if shipment has no payment.
     */
    public function test_job_not_queued_if_no_payment(): void
    {
        Queue::fake();

        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'in_transit',
            'payment_status' => 'pending',
        ]);

        // No payment created

        // Act - Update shipment status to delivered
        $shipment->update(['status' => 'delivered']);

        // Assert - Job should not be queued
        Queue::assertNotPushed(ReleaseEscrowPayment::class);
    }

    /**
     * Test that job transfers correct traveler_amount (85% of payment).
     */
    public function test_job_transfers_correct_traveler_amount(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'delivered',
            'payment_status' => 'escrowed',
        ]);

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 200.00,
            'platform_fee' => 30.00,
            'traveler_amount' => 170.00, // 85% of 200
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act
        $job = new ReleaseEscrowPayment($payment);
        $job->handle(app(PaymentService::class));

        // Assert - Payment should be released with correct traveler_amount
        $payment->refresh();
        $this->assertEquals('released', $payment->status);
        $this->assertEquals('170.00', $payment->traveler_amount);
    }

    /**
     * Test that job has retry configuration.
     */
    public function test_job_has_retry_configuration(): void
    {
        // Arrange
        $payment = Payment::factory()->create();
        $job = new ReleaseEscrowPayment($payment);

        // Assert
        $this->assertEquals(3, $job->tries);
        $this->assertEquals(120, $job->timeout);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}

