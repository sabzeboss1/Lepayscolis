<?php

namespace Tests\Unit\Resources;

use App\Http\Resources\ShipmentResource;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ShipmentResourceTest - Test shipment resource transformation
 * 
 * Tests:
 * - All shipment fields are included
 * - Relationships are included when loaded
 * - Dates are formatted as ISO 8601
 * 
 * Validates Requirements: 4.15, 12.14-12.15
 */
class ShipmentResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_resource_includes_all_shipment_fields(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
        ]);

        $resource = new ShipmentResource($shipment);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('sender_id', $array);
        $this->assertArrayHasKey('traveler_id', $array);
        $this->assertArrayHasKey('trip_id', $array);
        $this->assertArrayHasKey('package_description', $array);
        $this->assertArrayHasKey('package_weight', $array);
        $this->assertArrayHasKey('package_length', $array);
        $this->assertArrayHasKey('package_width', $array);
        $this->assertArrayHasKey('package_height', $array);
        $this->assertArrayHasKey('pickup_city', $array);
        $this->assertArrayHasKey('pickup_country', $array);
        $this->assertArrayHasKey('pickup_address', $array);
        $this->assertArrayHasKey('delivery_city', $array);
        $this->assertArrayHasKey('delivery_country', $array);
        $this->assertArrayHasKey('delivery_address', $array);
        $this->assertArrayHasKey('status', $array);
        $this->assertArrayHasKey('payment_amount', $array);
        $this->assertArrayHasKey('payment_status', $array);
        $this->assertArrayHasKey('created_at', $array);
        $this->assertArrayHasKey('updated_at', $array);
    }

    public function test_resource_includes_sender_when_loaded(): void
    {
        $sender = User::factory()->create();
        $shipment = Shipment::factory()->create(['sender_id' => $sender->id]);
        $shipment->load('sender');

        $resource = new ShipmentResource($shipment);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('sender', $array);
        $this->assertIsArray($array['sender']);
        $this->assertEquals($sender->id, $array['sender']['id']);
    }

    public function test_resource_includes_traveler_when_loaded(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        $shipment = Shipment::factory()->create([
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
        ]);
        $shipment->load('traveler');

        $resource = new ShipmentResource($shipment);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('traveler', $array);
        $this->assertIsArray($array['traveler']);
        $this->assertEquals($traveler->id, $array['traveler']['id']);
    }

    public function test_resource_includes_trip_when_loaded(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        $shipment = Shipment::factory()->create([
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
        ]);
        $shipment->load('trip');

        $resource = new ShipmentResource($shipment);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('trip', $array);
        $this->assertIsArray($array['trip']);
        $this->assertEquals($trip->id, $array['trip']['id']);
    }

    public function test_dates_are_formatted_as_iso_8601(): void
    {
        $shipment = Shipment::factory()->create();

        $resource = new ShipmentResource($shipment);
        $array = $resource->toArray(request());

        // ISO 8601 format: YYYY-MM-DDTHH:MM:SS.sssZ (accepts 3-6 decimal places)
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}Z$/',
            $array['created_at']
        );
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}Z$/',
            $array['updated_at']
        );
    }
}
