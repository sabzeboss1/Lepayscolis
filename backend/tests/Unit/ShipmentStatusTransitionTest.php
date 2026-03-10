<?php

namespace Tests\Unit;

use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ShipmentStatusTransitionTest - Test shipment status transition validation
 * 
 * Tests:
 * - Valid status transitions
 * - Invalid status transitions
 * - Cancellation restrictions when payment is released
 * 
 * Validates Requirements: 4.12-4.14, 13.11-13.12
 */
class ShipmentStatusTransitionTest extends TestCase
{
    use RefreshDatabase;

    // ========== Valid Transitions ==========

    public function test_can_transition_from_pending_to_accepted(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $this->assertTrue($shipment->canTransitionTo('accepted'));
    }

    public function test_can_transition_from_pending_to_cancelled(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $this->assertTrue($shipment->canTransitionTo('cancelled'));
    }

    public function test_can_transition_from_accepted_to_in_transit(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'accepted']);

        $this->assertTrue($shipment->canTransitionTo('in_transit'));
    }

    public function test_can_transition_from_accepted_to_cancelled(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'accepted']);

        $this->assertTrue($shipment->canTransitionTo('cancelled'));
    }

    public function test_can_transition_from_in_transit_to_delivered(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'in_transit']);

        $this->assertTrue($shipment->canTransitionTo('delivered'));
    }

    public function test_can_transition_from_in_transit_to_cancelled(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'in_transit']);

        $this->assertTrue($shipment->canTransitionTo('cancelled'));
    }

    // ========== Invalid Transitions ==========

    public function test_cannot_transition_from_pending_to_in_transit(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $this->assertFalse($shipment->canTransitionTo('in_transit'));
    }

    public function test_cannot_transition_from_pending_to_delivered(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $this->assertFalse($shipment->canTransitionTo('delivered'));
    }

    public function test_cannot_transition_from_accepted_to_delivered(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'accepted']);

        $this->assertFalse($shipment->canTransitionTo('delivered'));
    }

    public function test_cannot_transition_from_delivered_to_any_status(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'delivered']);

        $this->assertFalse($shipment->canTransitionTo('pending'));
        $this->assertFalse($shipment->canTransitionTo('accepted'));
        $this->assertFalse($shipment->canTransitionTo('in_transit'));
        $this->assertFalse($shipment->canTransitionTo('cancelled'));
    }

    public function test_cannot_transition_from_cancelled_to_any_status(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'cancelled']);

        $this->assertFalse($shipment->canTransitionTo('pending'));
        $this->assertFalse($shipment->canTransitionTo('accepted'));
        $this->assertFalse($shipment->canTransitionTo('in_transit'));
        $this->assertFalse($shipment->canTransitionTo('delivered'));
    }

    // ========== Payment Status Restrictions ==========

    public function test_cannot_cancel_when_payment_is_released(): void
    {
        $shipment = Shipment::factory()->create([
            'status' => 'in_transit',
            'payment_status' => 'released',
        ]);

        $this->assertFalse($shipment->canTransitionTo('cancelled'));
    }

    public function test_can_cancel_when_payment_is_pending(): void
    {
        $shipment = Shipment::factory()->create([
            'status' => 'accepted',
            'payment_status' => 'pending',
        ]);

        $this->assertTrue($shipment->canTransitionTo('cancelled'));
    }

    public function test_can_cancel_when_payment_is_escrowed(): void
    {
        $shipment = Shipment::factory()->create([
            'status' => 'in_transit',
            'payment_status' => 'escrowed',
        ]);

        $this->assertTrue($shipment->canTransitionTo('cancelled'));
    }

    // ========== Accept Method Tests ==========

    public function test_accept_method_updates_shipment_correctly(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = \App\Models\Trip::factory()->create(['traveler_id' => $traveler->id]);
        $shipment = Shipment::factory()->create(['status' => 'pending']);

        $shipment->accept($traveler, $trip);

        $this->assertEquals('accepted', $shipment->status);
        $this->assertEquals($traveler->id, $shipment->traveler_id);
        $this->assertEquals($trip->id, $shipment->trip_id);
    }

    // ========== Confirm Delivery Method Tests ==========

    public function test_confirm_delivery_method_updates_status(): void
    {
        $shipment = Shipment::factory()->create(['status' => 'in_transit']);

        $shipment->confirmDelivery();

        $this->assertEquals('delivered', $shipment->status);
    }
}
