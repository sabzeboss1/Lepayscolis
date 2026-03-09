<?php

namespace Tests\Unit;

use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test shipment has correct fillable attributes.
     */
    public function test_shipment_has_correct_fillable_attributes(): void
    {
        $fillable = [
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
        ];

        $shipment = new Shipment();
        $this->assertEquals($fillable, $shipment->getFillable());
    }

    /**
     * Test shipment casts attributes correctly.
     */
    public function test_shipment_casts_attributes_correctly(): void
    {
        $shipment = Shipment::factory()->create([
            'package_weight' => 10.5,
            'payment_amount' => 100.75,
            'package_length' => 50,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $this->assertIsString($shipment->package_weight);
        $this->assertEquals('10.50', $shipment->package_weight);
        $this->assertIsString($shipment->payment_amount);
        $this->assertEquals('100.75', $shipment->payment_amount);
        $this->assertIsInt($shipment->package_length);
        $this->assertIsString($shipment->status);
        $this->assertIsString($shipment->payment_status);
    }

    /**
     * Test shipment belongs to sender (User).
     */
    public function test_shipment_belongs_to_sender(): void
    {
        $sender = User::factory()->create();
        $shipment = Shipment::factory()->create(['sender_id' => $sender->id]);

        $this->assertInstanceOf(User::class, $shipment->sender);
        $this->assertEquals($sender->id, $shipment->sender->id);
    }

    /**
     * Test shipment belongs to traveler (User).
     */
    public function test_shipment_belongs_to_traveler(): void
    {
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->accepted()->create(['traveler_id' => $traveler->id]);

        $this->assertInstanceOf(User::class, $shipment->traveler);
        $this->assertEquals($traveler->id, $shipment->traveler->id);
    }

    /**
     * Test shipment belongs to trip.
     */
    public function test_shipment_belongs_to_trip(): void
    {
        $trip = Trip::factory()->create();
        $shipment = Shipment::factory()->accepted()->create(['trip_id' => $trip->id]);

        $this->assertInstanceOf(Trip::class, $shipment->trip);
        $this->assertEquals($trip->id, $shipment->trip->id);
    }

    /**
     * Test canTransitionTo method validates pending to accepted transition.
     */
    public function test_can_transition_from_pending_to_accepted(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $this->assertTrue($shipment->canTransitionTo('accepted'));
        $this->assertTrue($shipment->canTransitionTo('cancelled'));
        $this->assertFalse($shipment->canTransitionTo('in_transit'));
        $this->assertFalse($shipment->canTransitionTo('delivered'));
    }

    /**
     * Test canTransitionTo method validates accepted to in_transit transition.
     */
    public function test_can_transition_from_accepted_to_in_transit(): void
    {
        $shipment = Shipment::factory()->accepted()->create(['status' => 'accepted']);

        $this->assertTrue($shipment->canTransitionTo('in_transit'));
        $this->assertTrue($shipment->canTransitionTo('cancelled'));
        $this->assertFalse($shipment->canTransitionTo('pending'));
        $this->assertFalse($shipment->canTransitionTo('delivered'));
    }

    /**
     * Test canTransitionTo method validates in_transit to delivered transition.
     */
    public function test_can_transition_from_in_transit_to_delivered(): void
    {
        $shipment = Shipment::factory()->inTransit()->create(['status' => 'in_transit']);

        $this->assertTrue($shipment->canTransitionTo('delivered'));
        $this->assertTrue($shipment->canTransitionTo('cancelled'));
        $this->assertFalse($shipment->canTransitionTo('pending'));
        $this->assertFalse($shipment->canTransitionTo('accepted'));
    }

    /**
     * Test canTransitionTo method prevents transitions from delivered status.
     */
    public function test_cannot_transition_from_delivered(): void
    {
        $shipment = Shipment::factory()->delivered()->create(['status' => 'delivered']);

        $this->assertFalse($shipment->canTransitionTo('pending'));
        $this->assertFalse($shipment->canTransitionTo('accepted'));
        $this->assertFalse($shipment->canTransitionTo('in_transit'));
        $this->assertFalse($shipment->canTransitionTo('cancelled'));
    }

    /**
     * Test canTransitionTo method prevents cancellation when payment is released.
     */
    public function test_cannot_cancel_when_payment_released(): void
    {
        $shipment = Shipment::factory()->create([
            'status' => 'accepted',
            'payment_status' => 'released',
        ]);

        $this->assertFalse($shipment->canTransitionTo('cancelled'));
    }

    /**
     * Test accept method updates shipment with traveler and trip.
     */
    public function test_accept_method_updates_shipment(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);
        $traveler = User::factory()->create();
        $trip = Trip::factory()->create();

        $shipment->accept($traveler, $trip);

        $this->assertEquals($traveler->id, $shipment->traveler_id);
        $this->assertEquals($trip->id, $shipment->trip_id);
        $this->assertEquals('accepted', $shipment->status);
    }

    /**
     * Test confirmDelivery method updates status to delivered.
     */
    public function test_confirm_delivery_updates_status(): void
    {
        $shipment = Shipment::factory()->inTransit()->create(['status' => 'in_transit']);

        $shipment->confirmDelivery();

        $this->assertEquals('delivered', $shipment->status);
    }

    /**
     * Test observer calculates payment_amount on creation when trip_id is set.
     */
    public function test_observer_calculates_payment_amount_on_creation(): void
    {
        $trip = Trip::factory()->create(['price_per_kg' => 10.00]);
        
        $shipment = Shipment::factory()->create([
            'trip_id' => $trip->id,
            'package_weight' => 5.5,
        ]);

        // Refresh to get the calculated value
        $shipment->refresh();
        
        $this->assertEquals('55.00', $shipment->payment_amount);
    }

    /**
     * Test observer validates status transitions on update.
     */
    public function test_observer_validates_status_transitions(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        // Valid transition should work
        $shipment->status = 'accepted';
        $shipment->save();
        $this->assertEquals('accepted', $shipment->status);

        // Invalid transition should throw exception
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid status transition from 'accepted' to 'pending'");
        
        $shipment->status = 'pending';
        $shipment->save();
    }

    /**
     * Test observer prevents cancellation when payment is released.
     */
    public function test_observer_prevents_cancellation_with_released_payment(): void
    {
        $shipment = Shipment::factory()->create([
            'status' => 'accepted',
            'payment_status' => 'released',
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid status transition from 'accepted' to 'cancelled'");

        $shipment->status = 'cancelled';
        $shipment->save();
    }

    /**
     * Test observer recalculates payment_amount when trip_id changes.
     */
    public function test_observer_recalculates_payment_on_trip_change(): void
    {
        $trip1 = Trip::factory()->create(['price_per_kg' => 10.00]);
        $trip2 = Trip::factory()->create(['price_per_kg' => 15.00]);
        
        $shipment = Shipment::factory()->create([
            'trip_id' => $trip1->id,
            'package_weight' => 5.0,
        ]);

        $shipment->refresh();
        $this->assertEquals('50.00', $shipment->payment_amount);

        // Change trip
        $shipment->trip_id = $trip2->id;
        $shipment->save();
        
        $shipment->refresh();
        $this->assertEquals('75.00', $shipment->payment_amount);
    }

    /**
     * Test observer recalculates payment_amount when package_weight changes.
     */
    public function test_observer_recalculates_payment_on_weight_change(): void
    {
        $trip = Trip::factory()->create(['price_per_kg' => 10.00]);
        
        $shipment = Shipment::factory()->create([
            'trip_id' => $trip->id,
            'package_weight' => 5.0,
        ]);

        $shipment->refresh();
        $this->assertEquals('50.00', $shipment->payment_amount);

        // Change weight
        $shipment->package_weight = 8.0;
        $shipment->save();
        
        $shipment->refresh();
        $this->assertEquals('80.00', $shipment->payment_amount);
    }

    /**
     * Test shipment uses UUID as primary key.
     */
    public function test_shipment_uses_uuid_primary_key(): void
    {
        $shipment = Shipment::factory()->create();

        $this->assertIsString($shipment->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $shipment->id
        );
    }

    /**
     * Test shipment uses soft deletes.
     */
    public function test_shipment_uses_soft_deletes(): void
    {
        $shipment = Shipment::factory()->create();
        $shipmentId = $shipment->id;

        $shipment->delete();

        $this->assertSoftDeleted('shipments', ['id' => $shipmentId]);
        $this->assertNotNull($shipment->deleted_at);
    }
}
