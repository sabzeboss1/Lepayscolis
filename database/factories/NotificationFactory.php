<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = [
            'shipment_created',
            'shipment_accepted',
            'shipment_in_transit',
            'shipment_delivered',
            'kyc_approved',
            'kyc_rejected',
            'rating_received',
            'payment_released',
            'payment_refunded',
            'message_received',
        ];

        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement($types),
            'title' => fake()->sentence(5),
            'body' => fake()->sentence(15),
            'data' => [
                'shipment_id' => fake()->uuid(),
                'action_url' => '/shipments/' . fake()->uuid(),
            ],
            'read_at' => null,
        ];
    }

    /**
     * Indicate that the notification has been read.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => now(),
        ]);
    }

    /**
     * Indicate that the notification is for a shipment.
     */
    public function shipment(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'shipment_created',
            'title' => 'New Shipment Request',
            'body' => 'A new shipment request has been created.',
        ]);
    }

    /**
     * Indicate that the notification is for KYC approval.
     */
    public function kycApproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'kyc_approved',
            'title' => 'KYC Approved',
            'body' => 'Your KYC documents have been approved.',
        ]);
    }

    /**
     * Indicate that the notification is for KYC rejection.
     */
    public function kycRejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'kyc_rejected',
            'title' => 'KYC Rejected',
            'body' => 'Your KYC documents have been rejected.',
        ]);
    }
}
