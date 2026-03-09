<?php

namespace Tests\Feature;

use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * ShipmentControllerTest - Test shipment controller endpoints
 * 
 * Tests all shipment endpoints:
 * - GET /api/shipments: list shipments
 * - POST /api/shipments: create shipment
 * - GET /api/shipments/{id}: get shipment details
 * - GET /api/shipments/my: get user's shipments
 * - PUT /api/shipments/{id}: update shipment status
 * - POST /api/shipments/{id}/accept: accept shipment
 * - POST /api/shipments/{id}/confirm-delivery: confirm delivery
 * 
 * Validates Requirements: 4.1-4.19
 */
class ShipmentControllerTest extends TestCase
{
    use RefreshDatabase;

    // ========== List Shipments Tests ==========

    public function test_can_list_shipments(): void
    {
        Shipment::factory()->count(5)->create();

        $response = $this->getJson('/api/shipments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'sender_id',
                        'package_description',
                        'status',
                        'created_at',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
    }

    public function test_can_filter_shipments_by_status(): void
    {
        Shipment::factory()->create(['status' => 'pending']);
        Shipment::factory()->create(['status' => 'accepted']);
        Shipment::factory()->create(['status' => 'delivered']);

        $response = $this->getJson('/api/shipments?status=pending');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('pending', $data[0]['status']);
    }

    public function test_shipments_list_includes_relationships(): void
    {
        $sender = User::factory()->create();
        $shipment = Shipment::factory()->create(['sender_id' => $sender->id]);

        $response = $this->getJson('/api/shipments');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.sender.id', $sender->id);
    }

    // ========== Create Shipment Tests ==========

    public function test_kyc_approved_user_can_create_shipment(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $data = [
            'package_description' => 'Electronics and accessories',
            'package_weight' => 5.5,
            'package_length' => 50,
            'package_width' => 30,
            'package_height' => 20,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Rue de la Paix',
            'delivery_city' => 'Dakar',
            'delivery_country' => 'Senegal',
            'delivery_address' => '456 Avenue Bourguiba',
        ];

        $response = $this->postJson('/api/shipments', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'sender_id',
                    'status',
                    'payment_status',
                ],
            ]);

        $this->assertDatabaseHas('shipments', [
            'sender_id' => $user->id,
            'package_description' => 'Electronics and accessories',
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);
    }

    public function test_non_kyc_user_cannot_create_shipment(): void
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        Sanctum::actingAs($user);

        $data = [
            'package_description' => 'Electronics',
            'package_weight' => 5.5,
            'package_length' => 50,
            'package_width' => 30,
            'package_height' => 20,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Rue de la Paix',
            'delivery_city' => 'Dakar',
            'delivery_country' => 'Senegal',
            'delivery_address' => '456 Avenue Bourguiba',
        ];

        $response = $this->postJson('/api/shipments', $data);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'KYC verification required',
            ]);
    }

    public function test_unauthenticated_user_cannot_create_shipment(): void
    {
        $data = [
            'package_description' => 'Electronics',
            'package_weight' => 5.5,
            'package_length' => 50,
            'package_width' => 30,
            'package_height' => 20,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Rue de la Paix',
            'delivery_city' => 'Dakar',
            'delivery_country' => 'Senegal',
            'delivery_address' => '456 Avenue Bourguiba',
        ];

        $response = $this->postJson('/api/shipments', $data);

        $response->assertStatus(401);
    }

    public function test_prohibited_items_are_rejected(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $data = [
            'package_description' => 'Package contains weapons',
            'package_weight' => 5.5,
            'package_length' => 50,
            'package_width' => 30,
            'package_height' => 20,
            'pickup_city' => 'Paris',
            'pickup_country' => 'France',
            'pickup_address' => '123 Rue de la Paix',
            'delivery_city' => 'Dakar',
            'delivery_country' => 'Senegal',
            'delivery_address' => '456 Avenue Bourguiba',
        ];

        $response = $this->postJson('/api/shipments', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['package_description']);
    }

    // ========== Get Shipment Details Tests ==========

    public function test_can_get_shipment_details(): void
    {
        $shipment = Shipment::factory()->create();

        $response = $this->getJson("/api/shipments/{$shipment->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'sender_id',
                    'package_description',
                    'status',
                    'sender',
                ],
            ])
            ->assertJsonPath('data.id', $shipment->id);
    }

    public function test_returns_404_for_nonexistent_shipment(): void
    {
        $response = $this->getJson('/api/shipments/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404);
    }

    // ========== Get My Shipments Tests ==========

    public function test_can_get_my_shipments_as_sender(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Shipment::factory()->count(3)->create(['sender_id' => $user->id]);
        Shipment::factory()->count(2)->create(); // Other users' shipments

        $response = $this->getJson('/api/shipments/my');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(3, $data);
    }

    public function test_can_get_my_shipments_as_traveler(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($user);

        $trip = Trip::factory()->create(['traveler_id' => $user->id]);
        Shipment::factory()->count(2)->create([
            'traveler_id' => $user->id,
            'trip_id' => $trip->id,
        ]);
        Shipment::factory()->count(3)->create(); // Other users' shipments

        $response = $this->getJson('/api/shipments/my');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(2, $data);
    }

    public function test_my_shipments_requires_authentication(): void
    {
        $response = $this->getJson('/api/shipments/my');

        $response->assertStatus(401);
    }

    // ========== Update Shipment Status Tests ==========

    public function test_sender_can_update_shipment_status(): void
    {
        $sender = User::factory()->create();
        Sanctum::actingAs($sender);

        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
        ]);

        $response = $this->putJson("/api/shipments/{$shipment->id}", [
            'status' => 'cancelled',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_traveler_can_update_shipment_status(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($traveler);

        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        $shipment = Shipment::factory()->create([
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'accepted',
        ]);

        $response = $this->putJson("/api/shipments/{$shipment->id}", [
            'status' => 'in_transit',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'in_transit');
    }

    public function test_other_users_cannot_update_shipment_status(): void
    {
        $sender = User::factory()->create();
        $otherUser = User::factory()->create();
        Sanctum::actingAs($otherUser);

        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'pending',
        ]);

        $response = $this->putJson("/api/shipments/{$shipment->id}", [
            'status' => 'cancelled',
        ]);

        $response->assertStatus(403);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $sender = User::factory()->create();
        Sanctum::actingAs($sender);

        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'delivered',
        ]);

        $response = $this->putJson("/api/shipments/{$shipment->id}", [
            'status' => 'pending',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    // ========== Accept Shipment Tests ==========

    public function test_traveler_can_accept_shipment(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($traveler);

        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'available_capacity' => 10,
            'price_per_kg' => 20,
        ]);

        $shipment = Shipment::factory()->create([
            'status' => 'pending',
            'package_weight' => 5,
        ]);

        $response = $this->postJson("/api/shipments/{$shipment->id}/accept", [
            'trip_id' => $trip->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.traveler_id', $traveler->id)
            ->assertJsonPath('data.trip_id', $trip->id);

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => 'accepted',
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'payment_amount' => 100, // 5 kg * 20 per kg
        ]);

        // Check trip capacity was reduced
        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'available_capacity' => 5, // 10 - 5
        ]);
    }

    public function test_cannot_accept_shipment_with_insufficient_capacity(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($traveler);

        $trip = Trip::factory()->create([
            'traveler_id' => $traveler->id,
            'available_capacity' => 3,
        ]);

        $shipment = Shipment::factory()->create([
            'status' => 'pending',
            'package_weight' => 5,
        ]);

        $response = $this->postJson("/api/shipments/{$shipment->id}/accept", [
            'trip_id' => $trip->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['trip_id']);
    }

    public function test_cannot_accept_shipment_for_other_users_trip(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        $otherTraveler = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($traveler);

        $trip = Trip::factory()->create([
            'traveler_id' => $otherTraveler->id,
            'available_capacity' => 10,
        ]);

        $shipment = Shipment::factory()->create([
            'status' => 'pending',
            'package_weight' => 5,
        ]);

        $response = $this->postJson("/api/shipments/{$shipment->id}/accept", [
            'trip_id' => $trip->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['trip_id']);
    }

    // ========== Confirm Delivery Tests ==========

    public function test_sender_can_confirm_delivery(): void
    {
        $sender = User::factory()->create();
        Sanctum::actingAs($sender);

        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'in_transit',
        ]);

        $response = $this->postJson("/api/shipments/{$shipment->id}/confirm-delivery");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'delivered');

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => 'delivered',
        ]);
    }

    public function test_traveler_can_confirm_delivery(): void
    {
        $traveler = User::factory()->create(['kyc_status' => 'approved']);
        Sanctum::actingAs($traveler);

        $trip = Trip::factory()->create(['traveler_id' => $traveler->id]);
        $shipment = Shipment::factory()->create([
            'traveler_id' => $traveler->id,
            'trip_id' => $trip->id,
            'status' => 'in_transit',
        ]);

        $response = $this->postJson("/api/shipments/{$shipment->id}/confirm-delivery");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'delivered');
    }

    public function test_other_users_cannot_confirm_delivery(): void
    {
        $sender = User::factory()->create();
        $otherUser = User::factory()->create();
        Sanctum::actingAs($otherUser);

        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'status' => 'in_transit',
        ]);

        $response = $this->postJson("/api/shipments/{$shipment->id}/confirm-delivery");

        $response->assertStatus(403);
    }
}
