<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a trip can be created with all required fields.
     */
    public function test_trip_can_be_created_with_all_fields(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'approved',
        ]);

        $trip = Trip::create([
            'traveler_id' => $user->id,
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(7),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10),
            'available_capacity' => 25.50,
            'price_per_kg' => 15.00,
            'status' => 'active',
            'travel_proof_url' => 'https://s3.amazonaws.com/bucket/proof.pdf',
        ]);

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'traveler_id' => $user->id,
            'departure_city' => 'Paris',
            'arrival_city' => 'Dakar',
            'status' => 'active',
        ]);

        // Verify UUID is used
        $this->assertIsString($trip->id);
        $this->assertEquals(36, strlen($trip->id)); // UUID format
    }

    /**
     * Test that trip belongs to a traveler (user).
     */
    public function test_trip_belongs_to_traveler(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['traveler_id' => $user->id]);

        $this->assertInstanceOf(User::class, $trip->traveler);
        $this->assertEquals($user->id, $trip->traveler->id);
    }

    /**
     * Test that user has many trips relationship.
     */
    public function test_user_has_many_trips(): void
    {
        $user = User::factory()->create();
        $trip1 = Trip::factory()->create(['traveler_id' => $user->id]);
        $trip2 = Trip::factory()->create(['traveler_id' => $user->id]);

        $this->assertCount(2, $user->trips);
        $this->assertTrue($user->trips->contains($trip1));
        $this->assertTrue($user->trips->contains($trip2));
    }

    /**
     * Test active scope filters only active trips.
     */
    public function test_active_scope_filters_active_trips(): void
    {
        Trip::factory()->create(['status' => 'active']);
        Trip::factory()->create(['status' => 'completed']);
        Trip::factory()->create(['status' => 'cancelled']);

        $activeTrips = Trip::active()->get();

        $this->assertCount(1, $activeTrips);
        $this->assertEquals('active', $activeTrips->first()->status);
    }

    /**
     * Test upcoming scope filters future trips.
     */
    public function test_upcoming_scope_filters_future_trips(): void
    {
        Trip::factory()->create(['departure_date' => now()->addDays(5)]);
        Trip::factory()->create(['departure_date' => now()->subDays(5)]);

        $upcomingTrips = Trip::upcoming()->get();

        $this->assertCount(1, $upcomingTrips);
        $this->assertTrue($upcomingTrips->first()->departure_date->isFuture());
    }

    /**
     * Test byRoute scope filters trips by departure and arrival cities.
     */
    public function test_by_route_scope_filters_by_cities(): void
    {
        Trip::factory()->create([
            'departure_city' => 'Paris',
            'arrival_city' => 'Dakar',
        ]);
        Trip::factory()->create([
            'departure_city' => 'London',
            'arrival_city' => 'Lagos',
        ]);

        $trips = Trip::byRoute('Paris', 'Dakar')->get();

        $this->assertCount(1, $trips);
        $this->assertEquals('Paris', $trips->first()->departure_city);
        $this->assertEquals('Dakar', $trips->first()->arrival_city);
    }

    /**
     * Test that trips support soft deletes.
     */
    public function test_trips_support_soft_deletes(): void
    {
        $trip = Trip::factory()->create();
        $tripId = $trip->id;

        $trip->delete();

        // Trip should not be in default query
        $this->assertNull(Trip::find($tripId));

        // Trip should be in withTrashed query
        $this->assertNotNull(Trip::withTrashed()->find($tripId));
    }

    /**
     * Test that decimal fields are cast correctly.
     */
    public function test_decimal_fields_are_cast_correctly(): void
    {
        $trip = Trip::factory()->create([
            'available_capacity' => 25.50,
            'price_per_kg' => 15.75,
        ]);

        $this->assertEquals('25.50', $trip->available_capacity);
        $this->assertEquals('15.75', $trip->price_per_kg);
    }

    /**
     * Test that date fields are cast correctly.
     */
    public function test_date_fields_are_cast_correctly(): void
    {
        $departureDate = now()->addDays(7);
        $arrivalDate = now()->addDays(10);

        $trip = Trip::factory()->create([
            'departure_date' => $departureDate,
            'arrival_date' => $arrivalDate,
        ]);

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $trip->departure_date);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $trip->arrival_date);
        $this->assertEquals($departureDate->format('Y-m-d'), $trip->departure_date->format('Y-m-d'));
        $this->assertEquals($arrivalDate->format('Y-m-d'), $trip->arrival_date->format('Y-m-d'));
    }

    /**
     * Test that status field is cast correctly.
     */
    public function test_status_field_is_cast_correctly(): void
    {
        $trip = Trip::factory()->create(['status' => 'active']);

        $this->assertIsString($trip->status);
        $this->assertEquals('active', $trip->status);
    }

    /**
     * Test that trip has many shipments relationship.
     */
    public function test_trip_has_many_shipments(): void
    {
        $trip = Trip::factory()->create();
        
        // Create shipments associated with this trip
        $shipment1 = \App\Models\Shipment::factory()->create(['trip_id' => $trip->id]);
        $shipment2 = \App\Models\Shipment::factory()->create(['trip_id' => $trip->id]);

        $this->assertCount(2, $trip->shipments);
        $this->assertTrue($trip->shipments->contains($shipment1));
        $this->assertTrue($trip->shipments->contains($shipment2));
    }

    /**
     * Test byRoute scope with partial matching.
     */
    public function test_by_route_scope_supports_partial_matching(): void
    {
        Trip::factory()->create([
            'departure_city' => 'Paris',
            'arrival_city' => 'Dakar',
        ]);
        Trip::factory()->create([
            'departure_city' => 'Paris-Nord',
            'arrival_city' => 'Dakar-Centre',
        ]);
        Trip::factory()->create([
            'departure_city' => 'London',
            'arrival_city' => 'Lagos',
        ]);

        // Should match both Paris trips with partial search
        $trips = Trip::byRoute('Par', 'Dak')->get();

        $this->assertCount(2, $trips);
    }

    /**
     * Test that all fillable fields can be mass assigned.
     */
    public function test_all_fillable_fields_can_be_mass_assigned(): void
    {
        $user = User::factory()->create();
        
        $data = [
            'traveler_id' => $user->id,
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(7),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10),
            'available_capacity' => 25.50,
            'price_per_kg' => 15.00,
            'status' => 'active',
            'travel_proof_url' => 'https://s3.amazonaws.com/bucket/proof.pdf',
        ];

        $trip = Trip::create($data);

        foreach ($data as $key => $value) {
            if ($key === 'departure_date' || $key === 'arrival_date') {
                $this->assertEquals($value->format('Y-m-d'), $trip->$key->format('Y-m-d'));
            } else {
                $this->assertEquals($value, $trip->$key);
            }
        }
    }

    /**
     * Test that scopes can be chained together.
     */
    public function test_scopes_can_be_chained(): void
    {
        // Create active upcoming trip
        Trip::factory()->create([
            'status' => 'active',
            'departure_date' => now()->addDays(5),
            'departure_city' => 'Paris',
            'arrival_city' => 'Dakar',
        ]);

        // Create completed upcoming trip
        Trip::factory()->create([
            'status' => 'completed',
            'departure_date' => now()->addDays(5),
            'departure_city' => 'Paris',
            'arrival_city' => 'Dakar',
        ]);

        // Create active past trip
        Trip::factory()->create([
            'status' => 'active',
            'departure_date' => now()->subDays(5),
            'departure_city' => 'Paris',
            'arrival_city' => 'Dakar',
        ]);

        // Chain scopes: active + upcoming + byRoute
        $trips = Trip::active()->upcoming()->byRoute('Paris', 'Dakar')->get();

        $this->assertCount(1, $trips);
        $this->assertEquals('active', $trips->first()->status);
        $this->assertTrue($trips->first()->departure_date->isFuture());
    }

    /**
     * Test that travel_proof_url is nullable.
     */
    public function test_travel_proof_url_is_nullable(): void
    {
        $trip = Trip::factory()->create(['travel_proof_url' => null]);

        $this->assertNull($trip->travel_proof_url);
        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'travel_proof_url' => null,
        ]);
    }

    /**
     * Test that trip can be restored after soft delete.
     */
    public function test_trip_can_be_restored_after_soft_delete(): void
    {
        $trip = Trip::factory()->create();
        $tripId = $trip->id;

        $trip->delete();
        $this->assertNull(Trip::find($tripId));

        Trip::withTrashed()->find($tripId)->restore();
        $this->assertNotNull(Trip::find($tripId));
    }

    /**
     * Test that deleting a traveler soft deletes the user but trips remain.
     */
    public function test_deleting_traveler_soft_deletes_user(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['traveler_id' => $user->id]);
        $tripId = $trip->id;

        $user->delete();

        // Trip should still exist since User uses soft deletes
        $this->assertNotNull(Trip::find($tripId));
        
        // But the traveler relationship will return null since user is soft deleted
        $this->assertNull($trip->fresh()->traveler);
    }

    /**
     * Test upcoming scope excludes today's trips.
     */
    public function test_upcoming_scope_excludes_today_trips(): void
    {
        Trip::factory()->create(['departure_date' => now()]);
        Trip::factory()->create(['departure_date' => now()->addDay()]);

        $upcomingTrips = Trip::upcoming()->get();

        // Should only include tomorrow's trip, not today's
        $this->assertCount(1, $upcomingTrips);
    }

    /**
     * Test that status can be updated.
     */
    public function test_status_can_be_updated(): void
    {
        $trip = Trip::factory()->create(['status' => 'active']);

        $trip->update(['status' => 'completed']);

        $this->assertEquals('completed', $trip->fresh()->status);
        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'status' => 'completed',
        ]);
    }

    /**
     * Test that capacity and price can be updated.
     */
    public function test_capacity_and_price_can_be_updated(): void
    {
        $trip = Trip::factory()->create([
            'available_capacity' => 25.00,
            'price_per_kg' => 15.00,
        ]);

        $trip->update([
            'available_capacity' => 30.00,
            'price_per_kg' => 20.00,
        ]);

        $this->assertEquals('30.00', $trip->fresh()->available_capacity);
        $this->assertEquals('20.00', $trip->fresh()->price_per_kg);
    }
}

