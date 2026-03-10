<?php

namespace Tests\Unit\Resources;

use App\Http\Resources\TripResource;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for TripResource
 * 
 * Validates Requirements: 3.12, 12.14-12.15
 */
class TripResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_resource_transforms_trip_correctly(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'available_capacity' => 25.50,
            'price_per_kg' => 50.00,
            'status' => 'active',
        ]);

        $resource = new TripResource($trip);
        $array = $resource->toArray(request());

        $this->assertEquals($trip->id, $array['id']);
        $this->assertEquals($trip->traveler_id, $array['traveler_id']);
        $this->assertEquals('Paris', $array['departure_city']);
        $this->assertEquals('France', $array['departure_country']);
        $this->assertEquals('Dakar', $array['arrival_city']);
        $this->assertEquals('Senegal', $array['arrival_country']);
        $this->assertEquals('25.50', $array['available_capacity']);
        $this->assertEquals('50.00', $array['price_per_kg']);
        $this->assertEquals('active', $array['status']);
    }

    public function test_resource_formats_dates_as_iso8601(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);

        $resource = new TripResource($trip);
        $array = $resource->toArray(request());

        // Check that dates are in ISO 8601 format
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $array['created_at']
        );
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $array['updated_at']
        );
    }

    public function test_resource_includes_traveler_when_loaded(): void
    {
        $traveler = User::factory()->create([
            'name' => 'John Doe',
            'kyc_status' => 'approved',
            'rating' => 4.5,
            'completed_deliveries' => 10,
            'is_recommended' => true,
        ]);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        $trip->load('traveler');

        $resource = new TripResource($trip);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('traveler', $array);
        // whenLoaded returns a resource object, so we need to check if it's not null
        $this->assertNotNull($array['traveler']);
        
        // Convert the resource to array to check its contents
        $travelerArray = $array['traveler']->toArray(request());
        $this->assertEquals($traveler->id, $travelerArray['id']);
        $this->assertEquals('John Doe', $travelerArray['name']);
        $this->assertEquals('4.50', $travelerArray['rating']);
        $this->assertEquals(10, $travelerArray['completed_deliveries']);
        $this->assertTrue($travelerArray['is_recommended']);
    }

    public function test_resource_does_not_include_traveler_when_not_loaded(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        // Don't load traveler relationship

        $resource = new TripResource($trip);
        $array = $resource->toArray(request());

        // whenLoaded returns MissingValue when relationship is not loaded
        // When converted to JSON response, MissingValue fields are excluded
        // So we check that the traveler key exists but is a MissingValue instance
        $this->assertArrayHasKey('traveler', $array);
        $this->assertInstanceOf(\Illuminate\Http\Resources\MissingValue::class, $array['traveler']->resource);
    }

    public function test_resource_includes_travel_proof_url_when_present(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'travel_proof_url' => 'https://s3.amazonaws.com/bucket/travel-proofs/proof.pdf',
        ]);

        $resource = new TripResource($trip);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('travel_proof_url', $array);
        $this->assertEquals('https://s3.amazonaws.com/bucket/travel-proofs/proof.pdf', $array['travel_proof_url']);
    }

    public function test_resource_includes_null_travel_proof_url_when_absent(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'travel_proof_url' => null,
        ]);

        $resource = new TripResource($trip);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('travel_proof_url', $array);
        $this->assertNull($array['travel_proof_url']);
    }

    public function test_resource_collection_transforms_multiple_trips(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trips = Trip::factory()->count(3)->create(['traveler_id' => $traveler->id]);

        $collection = TripResource::collection($trips);
        $array = $collection->toArray(request());

        $this->assertCount(3, $array);
        foreach ($array as $index => $tripData) {
            $this->assertEquals($trips[$index]->id, $tripData['id']);
            $this->assertArrayHasKey('departure_city', $tripData);
            $this->assertArrayHasKey('arrival_city', $tripData);
        }
    }
}
