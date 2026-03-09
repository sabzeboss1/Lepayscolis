<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Feature tests for TripController
 * 
 * Validates Requirements: 3.1-3.16
 */
class TripControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake S3 storage for testing
        Storage::fake('s3-private');
        Storage::fake('s3-public');
    }

    // ========== LIST TRIPS TESTS ==========

    public function test_can_list_trips_without_authentication(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Trip::factory()->count(5)->create([
            'traveler_id' => $traveler->id,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/trips');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'departure_city',
                    'arrival_city',
                    'departure_date',
                    'arrival_date',
                    'available_capacity',
                    'price_per_kg',
                    'status',
                ]
            ],
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ]
        ]);
    }

    public function test_list_trips_eager_loads_traveler(): void
    {
        $traveler = User::factory()->create([
            'name' => 'John Traveler',
            'kyc_status' => 'approved',
        ]);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/trips');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.traveler.name', 'John Traveler');
    }

    public function test_list_trips_filters_by_departure_city(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'departure_city' => 'Paris',
            'status' => 'active',
        ]);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'departure_city' => 'London',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/trips?departure=Paris');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $response->assertJsonPath('data.0.departure_city', 'Paris');
    }

    public function test_list_trips_filters_by_arrival_city(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'arrival_city' => 'Dakar',
            'status' => 'active',
        ]);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'arrival_city' => 'Abidjan',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/trips?arrival=Dakar');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $response->assertJsonPath('data.0.arrival_city', 'Dakar');
    }

    public function test_list_trips_filters_by_date_range(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'departure_date' => now()->addDays(5),
            'status' => 'active',
        ]);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'departure_date' => now()->addDays(15),
            'status' => 'active',
        ]);

        $dateFrom = now()->addDays(10)->format('Y-m-d');
        $dateTo = now()->addDays(20)->format('Y-m-d');

        $response = $this->getJson("/api/trips?dateFrom={$dateFrom}&dateTo={$dateTo}");

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_list_trips_filters_by_minimum_capacity(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'available_capacity' => 10,
            'status' => 'active',
        ]);
        Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'available_capacity' => 30,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/trips?minCapacity=20');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertGreaterThanOrEqual(20, $response->json('data.0.available_capacity'));
    }

    public function test_list_trips_paginates_results(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Trip::factory()->count(20)->create([
            'traveler_id' => $traveler->id,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/trips?per_page=10');

        $response->assertStatus(200);
        $this->assertCount(10, $response->json('data'));
        $response->assertJsonPath('meta.per_page', 10);
        $response->assertJsonPath('meta.total', 20);
    }

    // ========== CREATE TRIP TESTS ==========

    public function test_kyc_approved_user_can_create_trip(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(5)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 50,
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'traveler_id',
                'departure_city',
                'arrival_city',
                'status',
            ]
        ]);
        $response->assertJsonPath('data.status', 'active');
        $response->assertJsonPath('data.traveler_id', $user->id);

        $this->assertDatabaseHas('trips', [
            'traveler_id' => $user->id,
            'departure_city' => 'Paris',
            'arrival_city' => 'Dakar',
            'status' => 'active',
        ]);
    }

    public function test_non_kyc_user_cannot_create_trip(): void
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        Sanctum::actingAs($user);

        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(5)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 50,
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'KYC verification required');
    }

    public function test_unauthenticated_user_cannot_create_trip(): void
    {
        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(5)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 50,
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(401);
    }

    public function test_create_trip_with_travel_proof(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->create('travel_proof.pdf', 1024);

        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(5)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 50,
            'travel_proof' => $file,
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(201);
        $response->assertJsonPath('data.travel_proof_url', function ($url) {
            return !empty($url);
        });

        // Verify file was uploaded to S3
        $this->assertTrue(Storage::disk('s3-private')->exists(
            Storage::disk('s3-private')->files()[0] ?? ''
        ));
    }

    public function test_create_trip_validates_departure_date_after_today(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->subDays(1)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 50,
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('departure_date');
    }

    public function test_create_trip_validates_arrival_date_after_departure(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(10)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(5)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 50,
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('arrival_date');
    }

    public function test_create_trip_validates_capacity_range(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(5)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 150, // Above maximum
            'price_per_kg' => 50,
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('available_capacity');
    }

    public function test_create_trip_validates_price_range(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $tripData = [
            'departure_city' => 'Paris',
            'departure_country' => 'France',
            'departure_date' => now()->addDays(5)->format('Y-m-d'),
            'arrival_city' => 'Dakar',
            'arrival_country' => 'Senegal',
            'arrival_date' => now()->addDays(10)->format('Y-m-d'),
            'available_capacity' => 25.5,
            'price_per_kg' => 1500, // Above maximum
        ];

        $response = $this->postJson('/api/trips', $tripData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('price_per_kg');
    }

    // ========== SHOW TRIP TESTS ==========

    public function test_can_view_trip_details(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);

        $response = $this->getJson("/api/trips/{$trip->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $trip->id);
        $response->assertJsonPath('data.departure_city', $trip->departure_city);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'traveler_id',
                'traveler' => [
                    'id',
                    'name',
                    'rating',
                ],
            ]
        ]);
    }

    public function test_returns_404_for_non_existent_trip(): void
    {
        $response = $this->getJson('/api/trips/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404);
    }

    // ========== MY TRIPS TESTS ==========

    public function test_user_can_view_own_trips(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        $otherUser = User::factory()->create(['kyc_status' => 'approved']);
        
        Sanctum::actingAs($user);

        Trip::factory()->count(3)->create(['traveler_id' => $user->id]);
        Trip::factory()->count(2)->create(['traveler_id' => $otherUser->id]);

        $response = $this->getJson('/api/trips/my');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        
        foreach ($response->json('data') as $trip) {
            $this->assertEquals($user->id, $trip['traveler_id']);
        }
    }

    public function test_my_trips_requires_authentication(): void
    {
        $response = $this->getJson('/api/trips/my');

        $response->assertStatus(401);
    }

    // ========== UPDATE TRIP TESTS ==========

    public function test_trip_owner_can_update_trip(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $user->id]);
        
        Sanctum::actingAs($user);

        $updateData = [
            'available_capacity' => 40,
            'price_per_kg' => 75,
        ];

        $response = $this->putJson("/api/trips/{$trip->id}", $updateData);

        $response->assertStatus(200);
        $response->assertJsonPath('data.available_capacity', '40.00');
        $response->assertJsonPath('data.price_per_kg', '75.00');

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'available_capacity' => 40,
            'price_per_kg' => 75,
        ]);
    }

    public function test_non_owner_cannot_update_trip(): void
    {
        $owner = User::factory()->create(['kyc_status' => 'approved']);
        $nonOwner = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $owner->id]);
        
        Sanctum::actingAs($nonOwner);

        $updateData = ['available_capacity' => 40];

        $response = $this->putJson("/api/trips/{$trip->id}", $updateData);

        $response->assertStatus(403);
    }

    public function test_update_trip_with_new_travel_proof(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create([
            'traveler_id' => $user->id,
            'travel_proof_url' => 'old_proof.pdf',
        ]);
        
        Sanctum::actingAs($user);

        $newFile = UploadedFile::fake()->create('new_proof.pdf', 1024);

        $response = $this->putJson("/api/trips/{$trip->id}", [
            'travel_proof' => $newFile,
        ]);

        $response->assertStatus(200);
        $this->assertNotEquals('old_proof.pdf', $response->json('data.travel_proof_url'));
    }

    // ========== DELETE TRIP TESTS ==========

    public function test_trip_owner_can_delete_trip(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $user->id]);
        
        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/trips/{$trip->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('trips', ['id' => $trip->id]);
    }

    public function test_non_owner_cannot_delete_trip(): void
    {
        $owner = User::factory()->create(['kyc_status' => 'approved']);
        $nonOwner = User::factory()->create(['kyc_status' => 'approved']);
        $trip = Trip::factory()->create(['traveler_id' => $owner->id]);
        
        Sanctum::actingAs($nonOwner);

        $response = $this->deleteJson("/api/trips/{$trip->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'deleted_at' => null]);
    }
}
