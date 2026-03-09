<?php

namespace Tests\Unit;

use App\Models\KYCDocument;
use App\Models\Rating;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_trips_relationship(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['traveler_id' => $user->id]);

        $this->assertTrue($user->trips->contains($trip));
        $this->assertInstanceOf(Trip::class, $user->trips->first());
    }

    public function test_user_has_shipments_as_sender_relationship(): void
    {
        $user = User::factory()->create();
        $shipment = Shipment::factory()->create(['sender_id' => $user->id]);

        $this->assertTrue($user->shipmentsAsSender->contains($shipment));
        $this->assertInstanceOf(Shipment::class, $user->shipmentsAsSender->first());
    }

    public function test_user_has_shipments_as_traveler_relationship(): void
    {
        $user = User::factory()->create();
        $shipment = Shipment::factory()->create(['traveler_id' => $user->id]);

        $this->assertTrue($user->shipmentsAsTraveler->contains($shipment));
        $this->assertInstanceOf(Shipment::class, $user->shipmentsAsTraveler->first());
    }

    public function test_user_has_ratings_received_relationship(): void
    {
        $user = User::factory()->create();
        $fromUser = User::factory()->create();
        $shipment = Shipment::factory()->create();
        
        $rating = Rating::factory()->create([
            'from_user_id' => $fromUser->id,
            'to_user_id' => $user->id,
            'shipment_id' => $shipment->id,
        ]);

        $this->assertTrue($user->ratingsReceived->contains($rating));
        $this->assertInstanceOf(Rating::class, $user->ratingsReceived->first());
    }

    public function test_user_has_ratings_given_relationship(): void
    {
        $user = User::factory()->create();
        $toUser = User::factory()->create();
        $shipment = Shipment::factory()->create();
        
        $rating = Rating::factory()->create([
            'from_user_id' => $user->id,
            'to_user_id' => $toUser->id,
            'shipment_id' => $shipment->id,
        ]);

        $this->assertTrue($user->ratingsGiven->contains($rating));
        $this->assertInstanceOf(Rating::class, $user->ratingsGiven->first());
    }

    public function test_user_has_kyc_documents_relationship(): void
    {
        $user = User::factory()->create();
        $kycDocument = KYCDocument::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->kycDocuments->contains($kycDocument));
        $this->assertInstanceOf(KYCDocument::class, $user->kycDocuments->first());
    }

    public function test_can_publish_trip_returns_true_when_kyc_approved(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);

        $this->assertTrue($user->canPublishTrip());
    }

    public function test_can_publish_trip_returns_false_when_kyc_not_approved(): void
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);

        $this->assertFalse($user->canPublishTrip());
    }

    public function test_can_create_shipment_returns_true_when_kyc_approved(): void
    {
        $user = User::factory()->create(['kyc_status' => 'approved']);

        $this->assertTrue($user->canCreateShipment());
    }

    public function test_can_create_shipment_returns_false_when_kyc_not_approved(): void
    {
        $user = User::factory()->create(['kyc_status' => 'rejected']);

        $this->assertFalse($user->canCreateShipment());
    }

    public function test_update_rating_calculates_average_from_received_ratings(): void
    {
        $user = User::factory()->create(['rating' => 0]);
        $fromUser1 = User::factory()->create();
        $fromUser2 = User::factory()->create();
        $shipment1 = Shipment::factory()->create();
        $shipment2 = Shipment::factory()->create();

        // Create ratings: 4 and 5, average should be 4.5
        Rating::factory()->create([
            'from_user_id' => $fromUser1->id,
            'to_user_id' => $user->id,
            'shipment_id' => $shipment1->id,
            'rating' => 4,
        ]);
        Rating::factory()->create([
            'from_user_id' => $fromUser2->id,
            'to_user_id' => $user->id,
            'shipment_id' => $shipment2->id,
            'rating' => 5,
        ]);

        $user->updateRating();

        $this->assertEquals(4.5, $user->rating);
    }

    public function test_update_recommended_status_sets_true_when_criteria_met(): void
    {
        $user = User::factory()->create([
            'rating' => 4.5,
            'completed_deliveries' => 5,
            'is_recommended' => false,
        ]);

        $user->updateRecommendedStatus();

        $this->assertTrue($user->is_recommended);
    }

    public function test_update_recommended_status_sets_false_when_rating_too_low(): void
    {
        $user = User::factory()->create([
            'rating' => 4.4,
            'completed_deliveries' => 5,
            'is_recommended' => true,
        ]);

        $user->updateRecommendedStatus();

        $this->assertFalse($user->is_recommended);
    }

    public function test_update_recommended_status_sets_false_when_deliveries_too_few(): void
    {
        $user = User::factory()->create([
            'rating' => 4.5,
            'completed_deliveries' => 4,
            'is_recommended' => true,
        ]);

        $user->updateRecommendedStatus();

        $this->assertFalse($user->is_recommended);
    }

    public function test_observer_calculates_is_recommended_on_save(): void
    {
        $user = User::factory()->create([
            'rating' => 4.5,
            'completed_deliveries' => 5,
            'is_recommended' => false,
        ]);

        // Trigger save to invoke observer
        $user->name = 'Updated Name';
        $user->save();

        $this->assertTrue($user->is_recommended);
    }

    public function test_observer_updates_is_recommended_to_false_when_criteria_not_met(): void
    {
        $user = User::factory()->create([
            'rating' => 4.5,
            'completed_deliveries' => 5,
            'is_recommended' => true,
        ]);

        // Update to not meet criteria
        $user->rating = 4.0;
        $user->save();

        $this->assertFalse($user->is_recommended);
    }

    public function test_user_casts_attributes_correctly(): void
    {
        $user = User::factory()->create([
            'rating' => 4.55,
            'completed_deliveries' => 10,
            'is_recommended' => true,
            'kyc_status' => 'approved',
            'locale' => 'fr',
        ]);

        // Laravel's decimal cast returns a string for precision
        $this->assertIsString($user->rating);
        $this->assertEquals('4.55', $user->rating);
        $this->assertIsInt($user->completed_deliveries);
        $this->assertIsBool($user->is_recommended);
        $this->assertIsString($user->kyc_status);
        $this->assertIsString($user->locale);
    }

    public function test_user_hides_password_in_array(): void
    {
        $user = User::factory()->create(['password' => 'secret123']);

        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
    }
}
