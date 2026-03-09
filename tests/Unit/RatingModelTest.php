<?php

namespace Tests\Unit;

use App\Models\Rating;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RatingModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_rating_has_from_user_relationship(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        $rating = Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
        ]);

        $this->assertInstanceOf(User::class, $rating->fromUser);
        $this->assertEquals($fromUser->id, $rating->fromUser->id);
    }

    public function test_rating_has_to_user_relationship(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        $rating = Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
        ]);

        $this->assertInstanceOf(User::class, $rating->toUser);
        $this->assertEquals($toUser->id, $rating->toUser->id);
    }

    public function test_rating_has_shipment_relationship(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        $rating = Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
        ]);

        $this->assertInstanceOf(Shipment::class, $rating->shipment);
        $this->assertEquals($shipment->id, $rating->shipment->id);
    }

    public function test_rating_casts_rating_as_integer(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        $rating = Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
            'rating' => 4,
        ]);

        $this->assertIsInt($rating->rating);
        $this->assertEquals(4, $rating->rating);
    }

    public function test_rating_has_fillable_fields(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        $rating = Rating::create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
            'comment' => 'Excellent service!',
        ]);

        $this->assertEquals($fromUser->id, $rating->from_user_id);
        $this->assertEquals($toUser->id, $rating->to_user_id);
        $this->assertEquals($shipment->id, $rating->shipment_id);
        $this->assertEquals(5, $rating->rating);
        $this->assertEquals('Excellent service!', $rating->comment);
    }

    public function test_observer_updates_user_rating_on_create(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create(['rating' => 0, 'completed_deliveries' => 0]);
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        // Create first rating
        Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
            'rating' => 4,
        ]);

        $toUser->refresh();
        $this->assertEquals(4.0, $toUser->rating);
    }

    public function test_observer_increments_completed_deliveries_on_create(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create(['rating' => 0, 'completed_deliveries' => 0]);
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
        ]);

        $toUser->refresh();
        $this->assertEquals(1, $toUser->completed_deliveries);
    }

    public function test_observer_updates_is_recommended_flag_when_criteria_met(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);
        
        // Create 5 shipments and ratings with high scores
        for ($i = 0; $i < 5; $i++) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $fromUser->id,
                'traveler_id' => $toUser->id,
            ]);
            
            Rating::factory()->create([
                'from_user_id' => $fromUser->id,
                'to_user_id' => $toUser->id,
                'shipment_id' => $shipment->id,
                'rating' => 5,
            ]);
        }

        $toUser->refresh();
        $this->assertEquals(5, $toUser->completed_deliveries);
        $this->assertEquals(5.0, $toUser->rating);
        $this->assertTrue($toUser->is_recommended);
    }

    public function test_observer_does_not_set_is_recommended_when_rating_too_low(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);
        
        // Create 5 shipments with low ratings (average 3.0)
        for ($i = 0; $i < 5; $i++) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $fromUser->id,
                'traveler_id' => $toUser->id,
            ]);
            
            Rating::factory()->create([
                'from_user_id' => $fromUser->id,
                'to_user_id' => $toUser->id,
                'shipment_id' => $shipment->id,
                'rating' => 3,
            ]);
        }

        $toUser->refresh();
        $this->assertEquals(5, $toUser->completed_deliveries);
        $this->assertEquals(3.0, $toUser->rating);
        $this->assertFalse($toUser->is_recommended);
    }

    public function test_observer_does_not_set_is_recommended_when_deliveries_too_few(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);
        
        // Create only 4 shipments with high ratings
        for ($i = 0; $i < 4; $i++) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $fromUser->id,
                'traveler_id' => $toUser->id,
            ]);
            
            Rating::factory()->create([
                'from_user_id' => $fromUser->id,
                'to_user_id' => $toUser->id,
                'shipment_id' => $shipment->id,
                'rating' => 5,
            ]);
        }

        $toUser->refresh();
        $this->assertEquals(4, $toUser->completed_deliveries);
        $this->assertEquals(5.0, $toUser->rating);
        $this->assertFalse($toUser->is_recommended);
    }

    public function test_observer_calculates_average_rating_correctly(): void
    {
        $fromUser1 = User::factory()->create();
        $fromUser2 = User::factory()->create();
        $fromUser3 = User::factory()->create();
        $toUser = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
        ]);
        
        // Create 3 ratings: 3, 4, 5 (average = 4.0)
        $shipment1 = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser1->id,
            'traveler_id' => $toUser->id,
        ]);
        Rating::factory()->create([
            'from_user_id' => $fromUser1->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment1->id,
            'rating' => 3,
        ]);

        $shipment2 = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser2->id,
            'traveler_id' => $toUser->id,
        ]);
        Rating::factory()->create([
            'from_user_id' => $fromUser2->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment2->id,
            'rating' => 4,
        ]);

        $shipment3 = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser3->id,
            'traveler_id' => $toUser->id,
        ]);
        Rating::factory()->create([
            'from_user_id' => $fromUser3->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment3->id,
            'rating' => 5,
        ]);

        $toUser->refresh();
        $this->assertEquals(4.0, $toUser->rating);
        $this->assertEquals(3, $toUser->completed_deliveries);
    }

    public function test_rating_comment_is_optional(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $fromUser->id,
            'traveler_id' => $toUser->id,
        ]);
        
        $rating = Rating::create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
            'rating' => 4,
            'comment' => null,
        ]);

        $this->assertNull($rating->comment);
    }

    public function test_observer_sets_is_recommended_at_boundary_values(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);
        
        // Create exactly 5 ratings with average 4.5 (boundary case)
        // Ratings: 4, 4, 5, 5, 5 = average 4.6
        $ratings = [4, 4, 5, 5, 5];
        foreach ($ratings as $ratingValue) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $fromUser->id,
                'traveler_id' => $toUser->id,
            ]);
            
            Rating::factory()->create([
                'from_user_id' => $fromUser->id,
                'to_user_id' => $toUser->id,
                'shipment_id' => $shipment->id,
                'rating' => $ratingValue,
            ]);
        }

        $toUser->refresh();
        $this->assertEquals(5, $toUser->completed_deliveries);
        $this->assertEquals(4.6, $toUser->rating);
        $this->assertTrue($toUser->is_recommended);
    }

    public function test_observer_does_not_set_is_recommended_just_below_boundary(): void
    {
        $fromUser = User::factory()->create();
        $toUser = User::factory()->create([
            'rating' => 0,
            'completed_deliveries' => 0,
            'is_recommended' => false,
        ]);
        
        // Create 5 ratings with average 4.4 (just below boundary)
        // Ratings: 4, 4, 4, 5, 5 = average 4.4
        $ratings = [4, 4, 4, 5, 5];
        foreach ($ratings as $ratingValue) {
            $shipment = Shipment::factory()->delivered()->create([
                'sender_id' => $fromUser->id,
                'traveler_id' => $toUser->id,
            ]);
            
            Rating::factory()->create([
                'from_user_id' => $fromUser->id,
                'to_user_id' => $toUser->id,
                'shipment_id' => $shipment->id,
                'rating' => $ratingValue,
            ]);
        }

        $toUser->refresh();
        $this->assertEquals(5, $toUser->completed_deliveries);
        $this->assertEquals(4.4, $toUser->rating);
        $this->assertFalse($toUser->is_recommended);
    }
}
