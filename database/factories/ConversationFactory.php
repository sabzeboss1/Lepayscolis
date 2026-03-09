<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        return [
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
            'shipment_id' => null,
        ];
    }

    /**
     * Indicate that the conversation is related to a shipment.
     */
    public function withShipment(): static
    {
        return $this->state(fn (array $attributes) => [
            'shipment_id' => Shipment::factory(),
        ]);
    }
}
