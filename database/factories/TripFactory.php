<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Trip>
 */
class TripFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $departureDate = fake()->dateTimeBetween('+1 week', '+2 months');
        $arrivalDate = fake()->dateTimeBetween($departureDate, '+3 months');

        return [
            'traveler_id' => User::factory(),
            'departure_city' => fake()->city(),
            'departure_country' => fake()->country(),
            'departure_date' => $departureDate,
            'arrival_city' => fake()->city(),
            'arrival_country' => fake()->country(),
            'arrival_date' => $arrivalDate,
            'available_capacity' => fake()->randomFloat(2, 0.1, 100),
            'price_per_kg' => fake()->randomFloat(2, 1, 1000),
            'status' => fake()->randomElement(['active', 'completed', 'cancelled']),
            'travel_proof_url' => fake()->optional()->url(),
        ];
    }

    /**
     * Indicate that the trip is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Indicate that the trip is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    /**
     * Indicate that the trip is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
