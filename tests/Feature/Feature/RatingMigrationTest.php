<?php

namespace Tests\Feature;

use App\Models\Rating;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RatingMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ratings_table_has_correct_columns(): void
    {
        $this->assertTrue(
            \Schema::hasTable('ratings'),
            'Ratings table does not exist'
        );

        $columns = [
            'id',
            'from_user_id',
            'to_user_id',
            'shipment_id',
            'rating',
            'comment',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                \Schema::hasColumn('ratings', $column),
                "Ratings table is missing column: {$column}"
            );
        }
    }

    public function test_can_create_rating_with_all_fields(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
        ]);

        $rating = Rating::create([
            'from_user_id' => $sender->id,
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
            'rating' => 5,
            'comment' => 'Excellent service!',
        ]);

        $this->assertDatabaseHas('ratings', [
            'id' => $rating->id,
            'from_user_id' => $sender->id,
            'to_user_id' => $traveler->id,
            'rating' => 5,
        ]);
    }

    public function test_rating_has_from_user_relationship(): void
    {
        $rating = Rating::factory()->create();

        $this->assertInstanceOf(User::class, $rating->fromUser);
    }

    public function test_rating_has_to_user_relationship(): void
    {
        $rating = Rating::factory()->create();

        $this->assertInstanceOf(User::class, $rating->toUser);
    }

    public function test_rating_has_shipment_relationship(): void
    {
        $rating = Rating::factory()->create();

        $this->assertInstanceOf(Shipment::class, $rating->shipment);
    }

    public function test_rating_value_can_be_1_to_5(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
        ]);

        for ($i = 1; $i <= 5; $i++) {
            $rating = Rating::create([
                'from_user_id' => $sender->id,
                'to_user_id' => $traveler->id,
                'shipment_id' => Shipment::factory()->delivered()->create([
                    'sender_id' => $sender->id,
                    'traveler_id' => $traveler->id,
                ])->id,
                'rating' => $i,
            ]);

            $this->assertEquals($i, $rating->rating);
        }
    }

    public function test_rating_comment_is_optional(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
        $shipment = Shipment::factory()->delivered()->create([
            'sender_id' => $sender->id,
            'traveler_id' => $traveler->id,
        ]);

        $rating = Rating::create([
            'from_user_id' => $sender->id,
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
            'rating' => 4,
            'comment' => null,
        ]);

        $this->assertNull($rating->comment);
    }

    public function test_rating_unique_constraint_on_users_and_shipment(): void
    {
        $sender = User::factory()->create();
        $traveler = User::factory()->create();
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

        $this->expectException(\Illuminate\Database\QueryException::class);

        Rating::create([
            'from_user_id' => $sender->id,
            'to_user_id' => $traveler->id,
            'shipment_id' => $shipment->id,
            'rating' => 4,
        ]);
    }

    public function test_rating_factory_creates_valid_rating(): void
    {
        $rating = Rating::factory()->create();

        $this->assertInstanceOf(Rating::class, $rating);
        $this->assertGreaterThanOrEqual(1, $rating->rating);
        $this->assertLessThanOrEqual(5, $rating->rating);
    }

    public function test_rating_factory_high_state(): void
    {
        $rating = Rating::factory()->high()->create();

        $this->assertGreaterThanOrEqual(4, $rating->rating);
        $this->assertLessThanOrEqual(5, $rating->rating);
    }

    public function test_rating_factory_low_state(): void
    {
        $rating = Rating::factory()->low()->create();

        $this->assertGreaterThanOrEqual(1, $rating->rating);
        $this->assertLessThanOrEqual(2, $rating->rating);
    }
}
