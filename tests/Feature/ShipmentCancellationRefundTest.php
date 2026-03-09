<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Test payment refund when shipment is cancelled with escrowed payment.
 * Requirements: 7.11-7.13
 */
class ShipmentCancellationRefundTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock PaymentService to prevent actual Stripe API calls
        $this->mockPaymentService();
    }

    /**
     * Mock PaymentService to prevent actual Stripe API calls.
     */
    protected function mockPaymentService(): void
    {
        $mock = Mockery::mock(PaymentService::class)->makePartial();
        
        $mock->shouldReceive('refundPayment')
            ->andReturnUsing(function (Payment $payment) {
                // Simulate refund without calling Stripe
                $payment->update(['status' => 'refunded']);
                $payment->shipment->update(['payment_status' => 'refunded']);
            });

        $this->app->instance(PaymentService::class, $mock);
    }

    /**
     * Test that payment is refunded when shipment is cancelled with escrowed payment.
     * Requirement 7.11: WHEN a shipment is cancelled with payment_status "escrowed", 
     * THE Payment_System SHALL create Stripe Refund
     */
    public function test_payment_refunded_when_shipment_cancelled_with_escrowed_payment(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'accepted',
            'payment_status' => 'escrowed',
            'payment_amount' => 100.00,
        ]);

        // Create escrowed payment
        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_' . uniqid(),
            'status' => 'escrowed',
            'escrowed_at' => now(),
        ]);

        // Act - Cancel the shipment
        $shipment->update(['status' => 'cancelled']);

        // Assert - Payment should be refunded
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'refunded',
        ]);
    }

    /**
     * Test that shipment payment_status is updated to 'refunded'.
     * Requirement 7.13: WHEN Stripe Refund succeeds, 
     * THE Payment_System SHALL update Shipment payment_status to "refunded"
     */
    public function test_shipment_payment_status_updated_to_refunded(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'accepted',
            'payment_status' => 'escrowed',
            'payment_amount' => 100.00,
        ]);

        Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_' . uniqid(),
            'status' => 'escrowed',
            'escrowed_at' => now(),
        ]);

        // Act
        $shipment->update(['status' => 'cancelled']);

        // Assert
        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'payment_status' => 'refunded',
        ]);
    }

    /**
     * Test that payment status is updated to 'refunded'.
     * Requirement 7.12: WHEN Stripe Refund succeeds, 
     * THE Payment_System SHALL update Payment status to "refunded"
     */
    public function test_payment_status_updated_to_refunded(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'accepted',
            'payment_status' => 'escrowed',
            'payment_amount' => 100.00,
        ]);

        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_' . uniqid(),
            'status' => 'escrowed',
            'escrowed_at' => now(),
        ]);

        // Act
        $shipment->update(['status' => 'cancelled']);

        // Assert
        $payment->refresh();
        $this->assertEquals('refunded', $payment->status);
    }

    /**
     * Test that refund is NOT triggered if payment status is not 'escrowed'.
     */
    public function test_refund_not_triggered_if_payment_not_escrowed(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'accepted',
            'payment_status' => 'processing',
            'payment_amount' => 100.00,
        ]);

        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_' . uniqid(),
            'status' => 'processing', // Not escrowed
        ]);

        // Act
        $shipment->update(['status' => 'cancelled']);

        // Assert - Payment status should remain 'processing'
        $payment->refresh();
        $this->assertEquals('processing', $payment->status);
    }

    /**
     * Test that refund is NOT triggered if shipment has no payment.
     */
    public function test_refund_not_triggered_if_no_payment_exists(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_amount' => 100.00,
        ]);

        // Act - Cancel shipment without payment
        $shipment->update(['status' => 'cancelled']);

        // Assert - No payments should exist
        $this->assertEquals(0, Payment::where('shipment_id', $shipment->id)->count());
    }

    /**
     * Test that refund is NOT triggered if shipment payment_status doesn't match.
     */
    public function test_refund_not_triggered_if_shipment_payment_status_mismatch(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'accepted',
            'payment_status' => 'processing', // Mismatch with payment status
            'payment_amount' => 100.00,
        ]);

        $payment = Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_' . uniqid(),
            'status' => 'escrowed',
            'escrowed_at' => now(),
        ]);

        // Act
        $shipment->update(['status' => 'cancelled']);

        // Assert - Payment should remain escrowed (not refunded)
        $payment->refresh();
        $this->assertEquals('escrowed', $payment->status);
    }

    /**
     * Test that shipment cancellation succeeds even if refund fails.
     */
    public function test_shipment_cancellation_succeeds_even_if_refund_fails(): void
    {
        // Arrange - Mock PaymentService to throw exception
        $mock = Mockery::mock(PaymentService::class);
        $mock->shouldReceive('refundPayment')
            ->andThrow(new \Exception('Stripe refund failed'));
        $this->app->instance(PaymentService::class, $mock);

        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'accepted',
            'payment_status' => 'escrowed',
            'payment_amount' => 100.00,
        ]);

        Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 100.00,
            'platform_fee' => 15.00,
            'traveler_amount' => 85.00,
            'payment_method' => 'card',
            'transaction_id' => 'pi_test_' . uniqid(),
            'status' => 'escrowed',
            'escrowed_at' => now(),
        ]);

        // Act - Cancel the shipment
        $shipment->update(['status' => 'cancelled']);

        // Assert - Shipment should still be cancelled even though refund failed
        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => 'cancelled',
        ]);
    }

    /**
     * Test refund with different payment amounts.
     */
    public function test_refund_handles_various_payment_amounts(): void
    {
        $amounts = [50.00, 100.00, 250.50, 999.99];

        foreach ($amounts as $amount) {
            // Arrange
            $sender = User::factory()->kycApproved()->create();
            $traveler = User::factory()->kycApproved()->create();
            $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
            
            $shipment = Shipment::factory()->create([
                'sender_id' => $sender->id,
                'traveler_id' => $traveler->id,
                'trip_id' => $trip->id,
                'status' => 'accepted',
                'payment_status' => 'escrowed',
                'payment_amount' => $amount,
            ]);

            $payment = Payment::create([
                'shipment_id' => $shipment->id,
                'payer_id' => $sender->id,
                'payee_id' => $traveler->id,
                'amount' => $amount,
                'platform_fee' => round($amount * 0.15, 2),
                'traveler_amount' => round($amount * 0.85, 2),
                'payment_method' => 'card',
                'transaction_id' => 'pi_test_' . uniqid(),
                'status' => 'escrowed',
                'escrowed_at' => now(),
            ]);

            // Act
            $shipment->update(['status' => 'cancelled']);

            // Assert
            $payment->refresh();
            $this->assertEquals('refunded', $payment->status, "Failed for amount: {$amount}");
        }
    }

    /**
     * Test that refund is triggered from different shipment statuses.
     */
    public function test_refund_triggered_from_various_statuses(): void
    {
        $statuses = ['accepted', 'in_transit'];

        foreach ($statuses as $status) {
            // Arrange
            $sender = User::factory()->kycApproved()->create();
            $traveler = User::factory()->kycApproved()->create();
            $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
            
            $shipment = Shipment::factory()->create([
                'sender_id' => $sender->id,
                'traveler_id' => $traveler->id,
                'trip_id' => $trip->id,
                'status' => $status,
                'payment_status' => 'escrowed',
                'payment_amount' => 100.00,
            ]);

            $payment = Payment::create([
                'shipment_id' => $shipment->id,
                'payer_id' => $sender->id,
                'payee_id' => $traveler->id,
                'amount' => 100.00,
                'platform_fee' => 15.00,
                'traveler_amount' => 85.00,
                'payment_method' => 'card',
                'transaction_id' => 'pi_test_' . uniqid(),
                'status' => 'escrowed',
                'escrowed_at' => now(),
            ]);

            // Act
            $shipment->update(['status' => 'cancelled']);

            // Assert
            $payment->refresh();
            $this->assertEquals('refunded', $payment->status, "Failed for status: {$status}");
        }
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
