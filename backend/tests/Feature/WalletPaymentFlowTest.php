<?php

namespace Tests\Feature;

use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use App\Models\Wallet;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletPaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected WalletService $walletService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->walletService = app(WalletService::class);
        
        // Disable broadcasting for tests
        \Illuminate\Support\Facades\Event::fake([
            \App\Events\ShipmentStatusChanged::class,
        ]);
    }

    /**
     * Test complete wallet payment flow: create shipment, accept, deliver, confirm.
     */
    public function test_complete_wallet_payment_flow(): void
    {
        // Arrange: Create users with KYC approved
        $sender = User::factory()->create(['kyc_status' => 'approved']);
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        
        // Update wallets (created automatically by UserObserver)
        $sender->wallet->update(['balance' => 100.00]);
        $traveler->wallet->update(['balance' => 0.00]);
        
        $senderWallet = $sender->wallet;
        $travelerWallet = $traveler->wallet;
        
        // Create trip
        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'price_per_kg' => 10.00,
            'available_capacity' => 20.00,
        ]);

        // Act 1: Sender creates shipment (funds should be held)
        $response = $this->actingAs($sender)->postJson('/api/shipments', [
            'trip_id' => $trip->id,
            'package_weight' => 5.0,
            'package_description' => 'Test package',
            'package_length' => 30,
            'package_width' => 20,
            'package_height' => 10,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Test St',
            'delivery_city' => 'London',
            'delivery_country' => 'UK',
            'delivery_address' => '456 Test Ave',
        ]);

        // Assert: Shipment created with held funds
        $response->assertStatus(201);
        $shipment = Shipment::first();
        $this->assertEquals('pending', $shipment->status);
        $this->assertEquals('escrowed', $shipment->payment_status);
        $this->assertEquals(50.00, $shipment->payment_amount); // 5kg × 10€
        
        // Assert: Sender wallet has funds held
        $senderWallet->refresh();
        $this->assertEquals(100.00, $senderWallet->balance);
        $this->assertEquals(50.00, $senderWallet->held_balance);
        $this->assertEquals(50.00, $senderWallet->available_balance);

        // Act 2: Traveler accepts shipment
        $response = $this->actingAs($traveler)->postJson("/api/shipments/{$shipment->id}/accept", [
            'trip_id' => $trip->id,
        ]);

        // Assert: Shipment accepted, funds still held
        $response->assertStatus(200);
        $shipment->refresh();
        $this->assertEquals('accepted', $shipment->status);
        $this->assertEquals('escrowed', $shipment->payment_status);
        
        $senderWallet->refresh();
        $this->assertEquals(100.00, $senderWallet->balance);
        $this->assertEquals(50.00, $senderWallet->held_balance);

        // Act 3: Update to in_transit
        $shipment->update(['status' => 'in_transit']);
        
        // Assert: Funds still held
        $senderWallet->refresh();
        $this->assertEquals(50.00, $senderWallet->held_balance);

        // Act 4: Confirm delivery (funds should be debited and credited)
        $response = $this->actingAs($sender)->postJson("/api/shipments/{$shipment->id}/confirm-delivery");

        // Assert: Delivery confirmed, payment processed
        $response->assertStatus(200);
        $shipment->refresh();
        $this->assertEquals('delivered', $shipment->status);
        $this->assertEquals('released', $shipment->payment_status);
        
        // Assert: Sender wallet debited
        $senderWallet->refresh();
        $this->assertEquals(50.00, $senderWallet->balance); // 100 - 50
        $this->assertEquals(0.00, $senderWallet->held_balance); // Released
        
        // Assert: Traveler wallet credited (85% of 50 = 42.50)
        $travelerWallet->refresh();
        $this->assertEquals(42.50, $travelerWallet->balance);
        
        // Assert: Wallet transactions created
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $senderWallet->id,
            'type' => 'hold',
            'amount' => 50.00,
        ]);
        
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $senderWallet->id,
            'type' => 'debit',
            'amount' => 50.00,
        ]);
        
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $travelerWallet->id,
            'type' => 'credit',
            'amount' => 42.50,
        ]);
    }

    /**
     * Test shipment creation fails with insufficient balance.
     */
    public function test_shipment_creation_fails_with_insufficient_balance(): void
    {
        // Arrange
        $sender = User::factory()->create(['kyc_status' => 'approved']);
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        
        // Update sender wallet
        $sender->wallet->update(['balance' => 30.00]);
        
        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'price_per_kg' => 10.00,
        ]);

        // Act
        $response = $this->actingAs($sender)->postJson('/api/shipments', [
            'trip_id' => $trip->id,
            'package_weight' => 5.0,
            'package_description' => 'Test package',
            'package_length' => 30,
            'package_width' => 20,
            'package_height' => 10,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Test St',
            'delivery_city' => 'London',
            'delivery_country' => 'UK',
            'delivery_address' => '456 Test Ave',
        ]);

        // Assert
        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Insufficient balance. Please recharge your wallet.',
            'required_amount' => '50.00',
            'available_balance' => '30.00',
            'shortfall' => '20.00',
        ]);
        
        // Assert: No shipment created
        $this->assertDatabaseCount('shipments', 0);
    }

    /**
     * Test shipment cancellation releases held funds.
     */
    public function test_shipment_cancellation_releases_held_funds(): void
    {
        // Arrange
        $sender = User::factory()->create(['kyc_status' => 'approved']);
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        
        $sender->wallet->update(['balance' => 100.00]);
        $senderWallet = $sender->wallet;
        
        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'price_per_kg' => 10.00,
        ]);

        // Create shipment (holds funds)
        $this->actingAs($sender)->postJson('/api/shipments', [
            'trip_id' => $trip->id,
            'package_weight' => 5.0,
            'package_description' => 'Test package',
            'package_length' => 30,
            'package_width' => 20,
            'package_height' => 10,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Test St',
            'delivery_city' => 'London',
            'delivery_country' => 'UK',
            'delivery_address' => '456 Test Ave',
        ]);

        $shipment = Shipment::first();
        
        // Assert: Funds held
        $senderWallet->refresh();
        $this->assertEquals(50.00, $senderWallet->held_balance);

        // Act: Cancel shipment
        $shipment->update(['status' => 'cancelled']);

        // Assert: Funds released
        $senderWallet->refresh();
        $this->assertEquals(100.00, $senderWallet->balance);
        $this->assertEquals(0.00, $senderWallet->held_balance);
        $this->assertEquals(100.00, $senderWallet->available_balance);
        
        $shipment->refresh();
        $this->assertEquals('refunded', $shipment->payment_status);
        
        // Assert: Hold cancelled transaction created
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $senderWallet->id,
            'type' => 'hold_cancelled',
            'amount' => 50.00,
        ]);
    }

    /**
     * Test multiple shipments with held funds.
     */
    public function test_multiple_shipments_with_held_funds(): void
    {
        // Arrange
        $sender = User::factory()->create(['kyc_status' => 'approved']);
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        
        $sender->wallet->update(['balance' => 100.00]);
        $senderWallet = $sender->wallet;
        
        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'price_per_kg' => 10.00,
            'available_capacity' => 50.00,
        ]);

        // Act 1: Create first shipment (30€)
        $this->actingAs($sender)->postJson('/api/shipments', [
            'trip_id' => $trip->id,
            'package_weight' => 3.0,
            'package_description' => 'Package 1',
            'package_length' => 30,
            'package_width' => 20,
            'package_height' => 10,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Test St',
            'delivery_city' => 'London',
            'delivery_country' => 'UK',
            'delivery_address' => '456 Test Ave',
        ]);

        // Assert: 30€ held
        $senderWallet->refresh();
        $this->assertEquals(100.00, $senderWallet->balance);
        $this->assertEquals(30.00, $senderWallet->held_balance);
        $this->assertEquals(70.00, $senderWallet->available_balance);

        // Act 2: Create second shipment (40€)
        $this->actingAs($sender)->postJson('/api/shipments', [
            'trip_id' => $trip->id,
            'package_weight' => 4.0,
            'package_description' => 'Package 2',
            'package_length' => 30,
            'package_width' => 20,
            'package_height' => 10,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Test St',
            'delivery_city' => 'London',
            'delivery_country' => 'UK',
            'delivery_address' => '456 Test Ave',
        ]);

        // Assert: 70€ held total
        $senderWallet->refresh();
        $this->assertEquals(100.00, $senderWallet->balance);
        $this->assertEquals(70.00, $senderWallet->held_balance);
        $this->assertEquals(30.00, $senderWallet->available_balance);

        // Act 3: Try to create third shipment (50€) - should fail
        $response = $this->actingAs($sender)->postJson('/api/shipments', [
            'trip_id' => $trip->id,
            'package_weight' => 5.0,
            'package_description' => 'Package 3',
            'package_length' => 30,
            'package_width' => 20,
            'package_height' => 10,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Test St',
            'delivery_city' => 'London',
            'delivery_country' => 'UK',
            'delivery_address' => '456 Test Ave',
        ]);

        // Assert: Third shipment fails
        $response->assertStatus(422);
        $this->assertDatabaseCount('shipments', 2); // Only 2 shipments created
    }
}
