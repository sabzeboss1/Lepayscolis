<?php

namespace Tests\Unit\Events;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageSentEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_broadcasts_on_correct_channel(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user1->id,
            'recipient_id' => $user2->id,
        ]);

        $event = new MessageSent($message);
        $channels = $event->broadcastOn();

        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertEquals('private-conversation.' . $conversation->id, $channels[0]->name);
    }

    public function test_event_broadcasts_with_correct_name(): void
    {
        $message = Message::factory()->create();
        $event = new MessageSent($message);

        $this->assertEquals('message.sent', $event->broadcastAs());
    }

    public function test_event_broadcasts_with_correct_data(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user1->id,
            'recipient_id' => $user2->id,
            'content' => 'Test message',
            'read' => false,
        ]);

        $event = new MessageSent($message);
        $data = $event->broadcastWith();

        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('conversation_id', $data);
        $this->assertArrayHasKey('sender_id', $data);
        $this->assertArrayHasKey('recipient_id', $data);
        $this->assertArrayHasKey('content', $data);
        $this->assertArrayHasKey('read', $data);
        $this->assertArrayHasKey('created_at', $data);

        $this->assertEquals($message->id, $data['id']);
        $this->assertEquals($conversation->id, $data['conversation_id']);
        $this->assertEquals($user1->id, $data['sender_id']);
        $this->assertEquals($user2->id, $data['recipient_id']);
        $this->assertEquals('Test message', $data['content']);
        $this->assertFalse($data['read']);
    }
}
