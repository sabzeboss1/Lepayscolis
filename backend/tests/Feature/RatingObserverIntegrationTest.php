<?php

namespace Tests\Feature;

use App\Models\Rating;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RatingObserverIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_rating_workflow_updates_user_correctly(): void
    {
        // Create a traveler with no ratings
        $traveler = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);

        // Create 5 different senders
        $senders = User::factory()->count(5)->create();

        // Create 5 delivered shipments and ratings
        $ratings = [5, 5, 4, 5, 4]; // Average = 4.6
        foreach ($senders as $index => $sender) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $sender->id,
                'traveler_id' => $traveler->id,
            ]);

            Rating::create([
                'from_user_id' => $sender->id,
                'to_user_id' => $traveler->id,
                'shipment_id' => $shipment->id,
                'rating' => $ratings[$index],
                'comment' => 'Test comment',
            ]);
        }

        // Refresh traveler to get updated values
        $traveler->refresh();

        // Verify all updates happened correctly
        $this->assertEquals(4.6, $traveler->rating);
        $this->assertEquals(5, $traveler->completed_deliveries);
        $this->assertTrue($traveler->is_recommended);
    }

    public function test_rating_workflow_does_not_recommend_with_low_rating(): void
    {
        $traveler = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);

        $senders = User::factory()->count(5)->create();

        // Create 5 ratings with average 4.0 (below 4.5 threshold)
        $ratings = [4, 4, 4, 4, 4];
        foreach ($senders as $index => $sender) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $sender->id,
                'traveler_id' => $traveler->id,
            ]);

            Rating::create([
                'from_user_id' => $sender->id,
                'to_user_id' => $traveler->id,
                'shipment_id' => $shipment->id,
                'rating' => $ratings[$index],
            ]);
        }

        $traveler->refresh();

        $this->assertEquals(4.0, $traveler->rating);
        $this->assertEquals(5, $traveler->completed_deliveries);
        $this->assertFalse($traveler->is_recommended); // Not recommended due to low rating
    }

    public function test_rating_workflow_does_not_recommend_with_few_deliveries(): void
    {
        $traveler = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);

        $senders = User::factory()->count(3)->create();

        // Create only 3 ratings with high average (below 5 deliveries threshold)
        foreach ($senders as $sender) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $sender->id,
                'traveler_id' => $traveler->id,
            ]);

            Rating::create([
                'from_user_id' => $sender->id,
                'to_user_id' => $traveler->id,
                'shipment_id' => $shipment->id,
                'rating' => 5,
            ]);
        }

        $traveler->refresh();

        $this->assertEquals(5.0, $traveler->rating);
        $this->assertEquals(3, $traveler->completed_deliveries);
        $this->assertFalse($traveler->is_recommended); // Not recommended due to few deliveries
    }
}
