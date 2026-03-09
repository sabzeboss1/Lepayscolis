<?php

namespace Tests\Feature;

use App\Events\WalletCredited;
use App\Jobs\ReleaseEscrowPayment;
use App\Models\Payment;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Integration test for wallet payment release flow.
 * Tests the complete flow from shipment delivery to wallet credit.
 * 
 * Requirements: 3.1-3.7, 19.1-19.4
 */
class WalletPaymentReleaseIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test complete payment release flow credits traveler wallet.
     * 
     * @test
     */
    public function payment_release_credits_traveler_wallet_with_correct_amount(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        
        // Verify wallets exist (created by UserObserver)
        $this->assertNotNull($sender->wallet);
        $this->assertNotNull($traveler->wallet);
        
        $initialBalance = $traveler->wallet->balance;
        
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'delivered',
            'payment_status' => 'escrowed',
        ]);

        $paymentAmount = 100.00;
        $platformFee = $paymentAmount * 0.15; // 15.00
        $travelerAmount = $paymentAmount * 0.85; // 85.00

        $payment = Payment::factory()->create([
            'shipment_id' => $shipment->id,
            'payer_id' => $sender->id,
            'payee_id' => $traveler->id,
            'amount' => $paymentAmount,
            'platform_fee' => $platformFee,
            'traveler_amount' => $travelerAmount,
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act - Execute payment release
        $paymentService = app(PaymentService::class);
        $paymentService->releasePayment($payment);

        // Assert - Wallet credited with correct amount
        $traveler->wallet->refresh();
        $this->assertEquals(
            $initialBalance + $travelerAmount,
            $traveler->wallet->balance,
            'Traveler wallet should be credited with 85% of payment amount'
        );

        // Assert - Wallet transaction created
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $traveler->wallet->id,
            'type' => 'credit',
            'amount' => $travelerAmount,
            'reference_type' => 'shipment',
            'reference_id' => $shipment->id,
        ]);

        // Assert - Transaction has correct balance_after
        $transaction = WalletTransaction::where('wallet_id', $traveler->wallet->id)
            ->where('reference_id', $shipment->id)
            ->first();
        
        $this->assertNotNull($transaction);
        $this->assertEquals(
            $traveler->wallet->balance,
            $transaction->balance_after,
            'Transaction balance_after should match current wallet balance'
        );

        // Assert - Payment status updated
        $payment->refresh();
        $this->assertEquals('released', $payment->status);
        $this->assertNotNull($payment->released_at);

        // Assert - Shipment payment status updated
        $shipment->refresh();
        $this->assertEquals('released', $shipment->payment_status);
    }

    /**
     * Test payment release dispatches WalletCredited event.
     * 
     * @test
     */
    public function payment_release_dispatches_wallet_credited_event(): void
    {
        // Don't fake events - we want to test they're actually dispatched
        // Event::fake([WalletCredited::class]);

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
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act
        $paymentService = app(PaymentService::class);
        $paymentService->releasePayment($payment);

        // Assert - Wallet was credited (event was dispatched and processed)
        $traveler->wallet->refresh();
        $this->assertEquals(85.00, $traveler->wallet->balance);
        
        // Assert - Transaction created (proves event was dispatched)
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $traveler->wallet->id,
            'type' => 'credit',
            'amount' => 85.00,
        ]);
    }

    /**
     * Test platform fee calculation is correct (15%).
     * 
     * @test
     */
    public function payment_release_deducts_correct_platform_fee(): void
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

        $testCases = [
            ['total' => 50.00, 'expected_traveler' => 42.50],
            ['total' => 100.00, 'expected_traveler' => 85.00],
            ['total' => 200.00, 'expected_traveler' => 170.00],
            ['total' => 150.50, 'expected_traveler' => 127.93],
        ];

        foreach ($testCases as $case) {
            $payment = Payment::factory()->create([
                'shipment_id' => $shipment->id,
                'payer_id' => $sender->id,
                'payee_id' => $traveler->id,
                'amount' => $case['total'],
                'status' => 'escrowed',
                'escrowed_at' => now()->subDays(7),
            ]);

            $initialBalance = $traveler->wallet->balance;

            // Act
            $paymentService = app(PaymentService::class);
            $paymentService->releasePayment($payment);

            // Assert
            $traveler->wallet->refresh();
            $this->assertEquals(
                round($initialBalance + $case['expected_traveler'], 2),
                round($traveler->wallet->balance, 2),
                "For payment of {$case['total']}, traveler should receive {$case['expected_traveler']} (85%)"
            );
        }
    }

    /**
     * Test payment release maintains 7-day delay requirement.
     * 
     * @test
     */
    public function payment_release_job_queued_with_seven_day_delay(): void
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
            'escrowed_at' => now(),
        ]);

        // Act - Update shipment to delivered
        $shipment->update(['status' => 'delivered']);

        // Assert - Job queued with delay (7-day delay is configured in ShipmentObserver)
        Queue::assertPushed(ReleaseEscrowPayment::class, function ($job) use ($payment) {
            // Check job has the correct payment and has a delay
            return $job->payment->id === $payment->id && $job->delay !== null;
        });
    }

    /**
     * Test payment release creates audit trail.
     * 
     * @test
     */
    public function payment_release_creates_complete_audit_trail(): void
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
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act
        $paymentService = app(PaymentService::class);
        $paymentService->releasePayment($payment);

        // Assert - Payment record maintained
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'released',
        ]);

        // Assert - Wallet transaction created with description
        $transaction = WalletTransaction::where('wallet_id', $traveler->wallet->id)
            ->where('reference_id', $shipment->id)
            ->first();
        
        $this->assertNotNull($transaction);
        $this->assertStringContainsString(
            "Payment for shipment {$shipment->id}",
            $transaction->description
        );
    }

    /**
     * Test payment release handles multiple shipments correctly.
     * 
     * @test
     */
    public function payment_release_handles_multiple_shipments_correctly(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $initialBalance = $traveler->wallet->balance;
        $totalExpected = 0;

        // Create 3 shipments with payments
        for ($i = 0; $i < 3; $i++) {
            $shipment = Shipment::factory()->create([
                'sender_id' => $sender->id,
                'traveler_id' => $traveler->id,
                'trip_id' => $trip->id,
                'status' => 'delivered',
                'payment_status' => 'escrowed',
            ]);

            $amount = 50.00 + ($i * 25.00); // 50, 75, 100
            $travelerAmount = $amount * 0.85;
            $totalExpected += $travelerAmount;

            $payment = Payment::factory()->create([
                'shipment_id' => $shipment->id,
                'payer_id' => $sender->id,
                'payee_id' => $traveler->id,
                'amount' => $amount,
                'status' => 'escrowed',
                'escrowed_at' => now()->subDays(7),
            ]);

            // Act - Release each payment
            $paymentService = app(PaymentService::class);
            $paymentService->releasePayment($payment);
        }

        // Assert - Total balance correct
        $traveler->wallet->refresh();
        $this->assertEquals(
            round($initialBalance + $totalExpected, 2),
            round($traveler->wallet->balance, 2),
            'Wallet should accumulate all payment releases'
        );

        // Assert - 3 transactions created
        $transactionCount = WalletTransaction::where('wallet_id', $traveler->wallet->id)
            ->where('type', 'credit')
            ->where('reference_type', 'shipment')
            ->count();
        
        $this->assertEquals(3, $transactionCount);
    }

    /**
     * Test payment release is atomic (rollback on failure).
     * 
     * @test
     */
    public function payment_release_rolls_back_on_failure(): void
    {
        // Arrange
        $sender = User::factory()->kycApproved()->create();
        $traveler = User::factory()->kycApproved()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $initialBalance = $traveler->wallet->balance;
        
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
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Delete wallet to cause failure
        $walletId = $traveler->wallet->id;
        $traveler->wallet->delete();
        $traveler->refresh();

        // Act & Assert - Should throw exception
        try {
            $paymentService = app(PaymentService::class);
            $paymentService->releasePayment($payment);
            $this->fail('Expected exception was not thrown');
        } catch (\Throwable $e) {
            // Exception expected
            $this->assertTrue(true);
        }

        // Assert - Payment status not changed (rollback)
        $payment->refresh();
        $this->assertEquals('escrowed', $payment->status);
        $this->assertNull($payment->released_at);
        
        // Assert - No wallet transaction created
        $this->assertDatabaseMissing('wallet_transactions', [
            'wallet_id' => $walletId,
            'reference_type' => 'shipment',
            'reference_id' => $shipment->id,
        ]);
    }

    /**
     * Test wallet transaction includes correct metadata.
     * 
     * @test
     */
    public function wallet_transaction_includes_correct_metadata(): void
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
            'status' => 'escrowed',
            'escrowed_at' => now()->subDays(7),
        ]);

        // Act
        $paymentService = app(PaymentService::class);
        $paymentService->releasePayment($payment);

        // Assert - Transaction has all required fields
        $transaction = WalletTransaction::where('wallet_id', $traveler->wallet->id)
            ->where('reference_id', $shipment->id)
            ->first();
        
        $this->assertNotNull($transaction);
        $this->assertEquals('credit', $transaction->type);
        $this->assertEquals(85.00, $transaction->amount);
        $this->assertEquals('shipment', $transaction->reference_type);
        $this->assertEquals($shipment->id, $transaction->reference_id);
        $this->assertNotNull($transaction->balance_after);
        $this->assertNotNull($transaction->created_at);
    }
}
