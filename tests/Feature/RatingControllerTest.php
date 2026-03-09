<?php

namespace Tests\Feature;

use App\Models\Rating;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RatingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_submit_rating_for_delivered_shipment(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);

        Sanctum::actingAs($sender);

        $response = $this->postJson('/api/ratings', [
            'to_user_id' => $traveler->id,
            'shipment_id' => (string) $shipment->id,
            'rating' => 5,
            'comment' => 'Excellent service!',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'from_user_id',
                'to_user_id',
                'shipment_id',
                'rating',
                'comment',
                'created_at',
            ],
        ]);

        $this->assertDatabaseHas('ratings', [
            'from_user_id' => $sender->id,
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
            'comment' => 'Excellent service!',
        ]);
    }

    public function test_rating_submission_requires_authentication(): void
    {
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create(['status' => 'delivered']);

        $response = $this->postJson('/api/ratings', [
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
        ]);

        $response->assertStatus(401);
    }

    public function test_cannot_rate_non_delivered_shipment(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'in_transit',
        ]);

        Sanctum::actingAs($sender);

        $response = $this->postJson('/api/ratings', [
            'to_user_id' => (string) $traveler->id,
            'shipment_id' => (string) $shipment->id,
            'rating' => 5,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['shipment_id']);
    }

    public function test_cannot_rate_same_shipment_twice(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);

        // Create existing rating
        Rating::factory()->create([
            'from_user_id' => $sender->id,
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
        ]);

        Sanctum::actingAs($sender);

        $response = $this->postJson('/api/ratings', [
            'to_user_id' => (string) $traveler->id,
            'shipment_id' => (string) $shipment->id,
            'rating' => 4,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['shipment_id']);
    }

    public function test_user_must_be_involved_in_shipment_to_rate(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $outsider = User::factory()->create();
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);

        Sanctum::actingAs($outsider);

        $response = $this->postJson('/api/ratings', [
            'to_user_id' => (string) $traveler->id,
            'shipment_id' => (string) $shipment->id,
            'rating' => 5,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['shipment_id']);
    }

    public function test_rating_updates_user_average_rating(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create(['rating' => 0.00]);
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);

        Sanctum::actingAs($sender);

        $this->postJson('/api/ratings', [
            'to_user_id' => (string) $traveler->id,
            'shipment_id' => (string) $shipment->id,
            'rating' => 5,
        ]);

        $traveler->refresh();
        $this->assertEquals(5.00, $traveler->rating);
    }

    public function test_rating_increments_completed_deliveries(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create(['completed_deliveries' => 0]);
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);

        Sanctum::actingAs($sender);

        $this->postJson('/api/ratings', [
            'to_user_id' => (string) $traveler->id,
            'shipment_id' => (string) $shipment->id,
            'rating' => 5,
        ]);

        $traveler->refresh();
        $this->assertEquals(1, $traveler->completed_deliveries);
    }

    public function test_high_rating_and_deliveries_sets_recommended_status(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create([
            'rating' => 4.40,
            'completed_deliveries' => 4,
            'is_recommended' => false,
        ]);
        $shipment = Shipment::factory()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
            'status' => 'delivered',
        ]);

        Sanctum::actingAs($sender);

        $this->postJson('/api/ratings', [
            'to_user_id' => (string) $traveler->id,
            'shipment_id' => (string) $shipment->id,
            'rating' => 5,
        ]);

        $traveler->refresh();
        $this->assertTrue($traveler->is_recommended);
        $this->assertEquals(5, $traveler->completed_deliveries);
        $this->assertGreaterThanOrEqual(4.5, $traveler->rating);
    }

    public function test_can_list_ratings_with_filters(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // Create ratings
        Rating::factory()->create(['to_user_id' => $user1->id]);
        Rating::factory()->create(['to_user_id' => $user1->id]);
        Rating::factory()->create(['to_user_id' => $user2->id]);

        $response = $this->getJson('/api/ratings?user_id=' . $user1->id);

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_can_list_ratings_by_shipment(): void
    {
        $shipment1 = Shipment::factory()->create();
        $shipment2 = Shipment::factory()->create();

        Rating::factory()->create(['shipment_id' => $shipment1->id]);
        Rating::factory()->create(['shipment_id' => $shipment1->id]);
        Rating::factory()->create(['shipment_id' => $shipment2->id]);

        $response = $this->getJson('/api/ratings?shipment_id=' . $shipment1->id);

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_ratings_list_includes_user_relationships(): void
    {
        $rating = Rating::factory()->create();

        $response = $this->getJson('/api/ratings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'rating',
                    'comment',
                    'from_user',
                    'to_user',
                ],
            ],
        ]);
    }

    public function test_ratings_are_paginated(): void
    {
        Rating::factory()->count(20)->create();

        $response = $this->getJson('/api/ratings?per_page=10');

        $response->assertStatus(200);
        $response->assertJsonCount(10, 'data');
        $response->assertJsonStructure([
            'data',
            'links',
            'meta',
        ]);
    }
}
