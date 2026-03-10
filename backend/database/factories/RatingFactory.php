<?php

namespace Database\Factories;

use App\Models\Rating;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Rating>
 */
class RatingFactory extends Factory
{
    protected $model = Rating::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $shipment = Shipment::factory()->delivered()->create();

        return [
            'from_user_id' => $shipment->sender_id,
            'to_user_id' => $shipment->traveler_id,
            'shipment_id' => $shipment->id,
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional()->sentence(20),
        ];
    }

    /**
     * Indicate a high rating (4-5 stars).
     */
    public function high(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => fake()->numberBetween(4, 5),
        ]);
    }

    /**
     * Indicate a low rating (1-2 stars).
     */
    public function low(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => fake()->numberBetween(1, 2),
        ]);
    }
}
