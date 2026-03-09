<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $conversation = Conversation::factory()->create();

        return [
            'conversation_id' => $conversation->id,
            'sender_id' => $conversation->user1_id,
            'recipient_id' => $conversation->user2_id,
            'content' => fake()->sentence(20),
            'read' => false,
            'read_at' => null,
        ];
    }

    /**
     * Indicate that the message has been read.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'read' => true,
            'read_at' => now(),
        ]);
    }
}
