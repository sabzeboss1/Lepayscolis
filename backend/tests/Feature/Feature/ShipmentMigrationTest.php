<?php

namespace Tests\Feature;

use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_shipments_table_has_correct_columns(): void
    {
        $this->assertTrue(
            \Schema::hasTable('shipments'),
            'Shipments table does not exist'
        );

        $columns = [
            'id',
            'sender_id',
            'traveler_id',
            'trip_id',
            'package_description',
            'package_weight',
            'package_length',
            'package_width',
            'package_height',
            'pickup_city',
            'pickup_country',
            'pickup_address',
            'delivery_city',
            'delivery_country',
            'delivery_address',
            'status',
            'payment_amount',
            'payment_status',
            'created_at',
            'updated_at',
            'deleted_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                \Schema::hasColumn('shipments', $column),
                "Shipments table is missing column: {$column}"
            );
        }
    }

    public function test_can_create_shipment_with_all_fields(): void
    {
        $sender = User::factory()->create(['kyc_status' => 'approved']);
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);

        $shipment = Shipment::create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'package_description' => 'Test package',
            'package_weight' => 5.5,
            'package_length' => 30,
            'package_width' => 20,
            'package_height' => 10,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Rue de Test',
            'delivery_city' => 'Dakar',
            'delivery_country' => 'Senegal',
            'delivery_address' => '456 Avenue Test',
            'status' => 'pending',
            'payment_amount' => 100.00,
            'payment_status' => 'pending',
        ]);

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'sender_id' => $sender->id,
            'package_description' => 'Test package',
        ]);
    }

    public function test_shipment_has_sender_relationship(): void
    {
        $sender = User::factory()->create();
        $shipment = Shipment::factory()->create(['sender_id' => $sender->id]);

        $this->assertInstanceOf(User::class, $shipment->sender);
        $this->assertEquals($sender->id, $shipment->sender->id);
    }

    public function test_shipment_has_traveler_relationship(): void
    {
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->accepted()->create(['traveler_id' => $traveler->id]);

        $this->assertInstanceOf(User::class, $shipment->traveler);
        $this->assertEquals($traveler->id, $shipment->traveler->id);
    }

    public function test_shipment_has_trip_relationship(): void
    {
        $trip = Trip::factory()->create();
        $shipment = Shipment::factory()->accepted()->create(['trip_id' => $trip->id]);

        $this->assertInstanceOf(Trip::class, $shipment->trip);
        $this->assertEquals($trip->id, $shipment->trip->id);
    }

    public function test_shipment_status_enum_values(): void
    {
        $sender = User::factory()->create();

        $statuses = ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'];

        foreach ($statuses as $status) {
            $shipment = Shipment::factory()->create([
                'sender_id' => $sender->id,
                'status' => $status,
            ]);

            $this->assertEquals($status, $shipment->status);
        }
    }

    public function test_shipment_payment_status_enum_values(): void
    {
        $sender = User::factory()->create();

        $paymentStatuses = ['pending', 'processing', 'escrowed', 'released', 'refunded'];

        foreach ($paymentStatuses as $paymentStatus) {
            $shipment = Shipment::factory()->create([
                'sender_id' => $sender->id,
                'payment_status' => $paymentStatus,
            ]);

            $this->assertEquals($paymentStatus, $shipment->payment_status);
        }
    }

    public function test_shipment_soft_deletes(): void
    {
        $shipment = Shipment::factory()->create();
        $shipmentId = $shipment->id;

        $shipment->delete();

        $this->assertSoftDeleted('shipments', ['id' => $shipmentId]);
        $this->assertNotNull($shipment->fresh()->deleted_at);
    }

    public function test_shipment_can_transition_to_valid_status(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $this->assertTrue($shipment->canTransitionTo('accepted'));
        $this->assertTrue($shipment->canTransitionTo('cancelled'));
        $this->assertFalse($shipment->canTransitionTo('in_transit'));
        $this->assertFalse($shipment->canTransitionTo('delivered'));
    }

    public function test_shipment_cannot_be_cancelled_when_payment_released(): void
    {
        $shipment = Shipment::factory()->create([
            'status' => 'delivered',
            'payment_status' => 'released',
        ]);

        $this->assertFalse($shipment->canTransitionTo('cancelled'));
    }

    public function test_shipment_accept_method(): void
    {
        $traveler = User::factory()->create();
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $shipment->accept($traveler, $trip);

        $this->assertEquals('accepted', $shipment->status);
        $this->assertEquals($traveler->id, $shipment->traveler_id);
        $this->assertEquals($trip->id, $shipment->trip_id);
    }

    public function test_shipment_confirm_delivery_method(): void
    {
        $shipment = Shipment::factory()->inTransit()->create();

        $shipment->confirmDelivery();

        $this->assertEquals('delivered', $shipment->status);
    }
}
