<?php

namespace Database\Factories;

use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shipment>
 */
class ShipmentFactory extends Factory
{
    protected $model = Shipment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sender_id' => User::factory(),
            'traveler_id' => null,
            'trip_id' => null,
            'package_description' => fake()->sentence(10),
            'package_weight' => fake()->randomFloat(2, 0.1, 100),
            'package_length' => fake()->numberBetween(1, 500),
            'package_width' => fake()->numberBetween(1, 500),
            'package_height' => fake()->numberBetween(1, 500),
            'pickup_city' => fake()->city(),
            'pickup_country' => fake()->country(),
            'pickup_address' => fake()->address(),
            'delivery_city' => fake()->city(),
            'delivery_country' => fake()->country(),
            'delivery_address' => fake()->address(),
            'status' => 'pending',
            'payment_amount' => fake()->randomFloat(2, 10, 1000),
            'payment_status' => 'pending',
        ];
    }

    /**
     * Indicate that the shipment has been accepted.
     */
    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'traveler_id' => User::factory(),
            'trip_id' => Trip::factory(),
            'status' => 'accepted',
            'payment_status' => 'escrowed',
        ]);
    }

    /**
     * Indicate that the shipment is in transit.
     */
    public function inTransit(): static
    {
        return $this->state(fn (array $attributes) => [
            'traveler_id' => User::factory(),
            'trip_id' => Trip::factory(),
            'status' => 'in_transit',
            'payment_status' => 'escrowed',
        ]);
    }

    /**
     * Indicate that the shipment has been delivered.
     */
    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'traveler_id' => User::factory(),
            'trip_id' => Trip::factory(),
            'status' => 'delivered',
            'payment_status' => 'released',
        ]);
    }

    /**
     * Indicate that the shipment has been cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'payment_status' => 'refunded',
        ]);
    }
}
