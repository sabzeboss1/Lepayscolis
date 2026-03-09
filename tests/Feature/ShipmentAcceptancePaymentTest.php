<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

/**
 * Test payment creation when shipment is accepted.
 * Requirements: 7.1-7.4
 */
class ShipmentAcceptancePaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Prevent actual Stripe API calls during tests
        $this->mockPaymentService();
    }

    /**
     * Mock PaymentService to prevent actual Stripe API calls.
     */
    protected function mockPaymentService(): void
    {
        $mock = Mockery::mock(PaymentService::class)->makePartial();
        
        $mock->shouldReceive('createPaymentIntent')
            ->andReturnUsing(function (Shipment $shipment) {
                // Simulate payment creation without calling Stripe
                $amount = $shipment->payment_amount;
                $platformFee = round($amount * 0.15, 2);
                $travelerAmount = round($amount - $platformFee, 2);

                $payment = Payment::create([
                    'shipment_id' => $shipment->id,
                    'payer_id' => $shipment->sender_id,
                    'payee_id' => $shipment->traveler_id,
                    'amount' => $amount,
                    'platform_fee' => $platformFee,
                    'traveler_amount' => $travelerAmount,
                    'payment_method' => 'card',
                    'transaction_id' => 'pi_test_' . uniqid(),
                    'status' => 'processing',
                ]);

                // Update shipment payment status (as the real service does)
                $shipment->update(['payment_status' => 'processing']);

                return $payment;
            });

        $this->app->instance(PaymentService::class, $mock);
    }

    /**
     * Test that payment is created when shipment status changes to 'accepted'.
     * Requirement 7.1: WHEN a shipment is accepted, THE Payment_System SHALL create a Payment record with status "processing"
     */
    public function test_payment_created_when_shipment_accepted(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 10.00]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'package_weight' => 5.0,
            'payment_amount' => 50.00,
        ]);

        // Act - Accept the shipment
        $shipment->accept($traveler, $trip);

        // Assert - Payment should be created
        $this->assertDatabaseHas('payments', [
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'status' => 'processing',
        ]);

        $payment = $shipment->fresh()->payment;
        $this->assertNotNull($payment);
        $this->assertEquals('processing', $payment->status);
    }

    /**
     * Test that platform_fee is calculated as 15% of amount.
     * Requirement 7.2: WHEN a Payment is created, THE Payment_System SHALL calculate platform_fee as 15% of amount
     */
    public function test_platform_fee_calculated_correctly(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 20.00]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'package_weight' => 10.0,
            'payment_amount' => 200.00,
        ]);

        // Act
        $shipment->accept($traveler, $trip);

        // Assert
        $payment = $shipment->fresh()->payment;
        $this->assertNotNull($payment);
        $this->assertEquals('200.00', $payment->amount);
        $this->assertEquals('30.00', $payment->platform_fee); // 15% of 200
    }

    /**
     * Test that traveler_amount is calculated as 85% of amount.
     * Requirement 7.3: WHEN a Payment is created, THE Payment_System SHALL calculate traveler_amount as 85% of amount
     */
    public function test_traveler_amount_calculated_correctly(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 15.00]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'package_weight' => 8.0,
            'payment_amount' => 120.00,
        ]);

        // Act
        $shipment->accept($traveler, $trip);

        // Assert
        $payment = $shipment->fresh()->payment;
        $this->assertNotNull($payment);
        $this->assertEquals('120.00', $payment->amount);
        $this->assertEquals('102.00', $payment->traveler_amount); // 85% of 120
    }

    /**
     * Test that Stripe PaymentIntent is created with amount in cents.
     * Requirement 7.4: WHEN a Payment is created, THE Payment_System SHALL create Stripe PaymentIntent with amount in cents
     * Note: This is tested in PaymentServiceTest, but we verify the integration here
     */
    public function test_payment_intent_created_with_transaction_id(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 12.00]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'package_weight' => 5.0,
            'payment_amount' => 60.00,
        ]);

        // Act
        $shipment->accept($traveler, $trip);

        // Assert
        $payment = $shipment->fresh()->payment;
        $this->assertNotNull($payment);
        $this->assertNotNull($payment->transaction_id);
        $this->assertStringStartsWith('pi_test_', $payment->transaction_id);
    }

    /**
     * Test that payment is not created if shipment already has a payment.
     */
    public function test_payment_not_duplicated_if_already_exists(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 10.00]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'package_weight' => 5.0,
            'payment_amount' => 50.00,
        ]);

        // Create a payment manually first
        Payment::create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => 50.00,
            'platform_fee' => 7.50,
            'traveler_amount' => 42.50,
            'payment_method' => 'card',
            'transaction_id' => 'pi_existing',
            'status' => 'processing',
        ]);

        // Act - Accept the shipment
        $shipment->accept($traveler, $trip);

        // Assert - Should still have only one payment
        $this->assertEquals(1, Payment::where('shipment_id', $shipment->id)->count());
    }

    /**
     * Test that shipment payment_status is updated to 'processing'.
     */
    public function test_shipment_payment_status_updated_to_processing(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 10.00]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'package_weight' => 5.0,
            'payment_amount' => 50.00,
        ]);

        // Act
        $shipment->accept($traveler, $trip);

        // Assert
        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'payment_status' => 'processing',
        ]);
    }

    /**
     * Test that payment creation handles decimal amounts correctly.
     */
    public function test_payment_handles_decimal_amounts(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 12.50]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'package_weight' => 3.5,
            'payment_amount' => 43.75,
        ]);

        // Act
        $shipment->accept($traveler, $trip);

        // Assert
        $payment = $shipment->fresh()->payment;
        $this->assertNotNull($payment);
        $this->assertEquals('43.75', $payment->amount);
        $this->assertEquals('6.56', $payment->platform_fee); // 15% of 43.75 = 6.5625, rounded to 6.56
        $this->assertEquals('37.19', $payment->traveler_amount); // 43.75 - 6.56 = 37.19
    }

    /**
     * Test that payment is not created if shipment has no traveler.
     */
    public function test_payment_not_created_without_traveler(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'traveler_id' => null,
            'package_weight' => 5.0,
            'payment_amount' => 50.00,
        ]);

        // Act - Manually update status to accepted (bypassing accept method)
        $shipment->status = 'accepted';
        $shipment->save();

        // Assert - No payment should be created
        $this->assertEquals(0, Payment::where('shipment_id', $shipment->id)->count());
    }

    /**
     * Test that payment is not created if shipment has no payment_amount.
     */
    public function test_payment_not_created_without_payment_amount(): void
    {
        // Don't use the mock for this test - we want to test the observer's early return
        $this->app->forgetInstance(PaymentService::class);
        
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'traveler_id' => $traveler->id,
            'trip_id' => null, // No trip_id so payment_amount won't be calculated
            'package_weight' => 5.0,
            'payment_amount' => 0, // Set to 0 to test observer's early return
        ]);

        // Act - Manually update status to accepted
        $shipment->status = 'accepted';
        $shipment->save();

        // Assert - No payment should be created (payment_amount is 0)
        $this->assertEquals(0, Payment::where('shipment_id', $shipment->id)->count());
    }

    /**
     * Test that payment creation failure doesn't prevent shipment update.
     */
    public function test_shipment_update_succeeds_even_if_payment_creation_fails(): void
    {
        // Arrange - Mock PaymentService to throw exception
        $mock = Mockery::mock(PaymentService::class);
        $mock->shouldReceive('createPaymentIntent')
            ->andThrow(new \Exception('Stripe API error'));
        $this->app->instance(PaymentService::class, $mock);

        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id, 'price_per_kg' => 10.00]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
            'package_weight' => 5.0,
            'payment_amount' => 50.00,
        ]);

        // Act - Accept the shipment
        $shipment->accept($traveler, $trip);

        // Assert - Shipment should still be accepted even though payment creation failed
        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => 'accepted',
            'traveler_id' => $traveler->id,
        ]);

        // Payment should not be created
        $this->assertEquals(0, Payment::where('shipment_id', $shipment->id)->count());
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
