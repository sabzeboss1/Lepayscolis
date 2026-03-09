<?php

namespace Tests\Unit;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_conversation_has_user1_relationship(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $this->assertInstanceOf(User::class, $conversation->user1);
        $this->assertEquals($user1->id, $conversation->user1->id);
    }

    public function test_conversation_has_user2_relationship(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $this->assertInstanceOf(User::class, $conversation->user2);
        $this->assertEquals($user2->id, $conversation->user2->id);
    }

    public function test_conversation_has_shipment_relationship(): void
    {
        $shipment = Shipment::factory()->create();
        $conversation = Conversation::factory()->create([
            'shipment_id' => $shipment->id,
        ]);

        $this->assertInstanceOf(Shipment::class, $conversation->shipment);
        $this->assertEquals($shipment->id, $conversation->shipment->id);
    }

    public function test_conversation_can_have_null_shipment(): void
    {
        $conversation = Conversation::factory()->create([
            'shipment_id' => null,
        ]);

        $this->assertNull($conversation->shipment);
    }

    public function test_conversation_has_messages_relationship(): void
    {
        $conversation = Conversation::factory()->create();
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
        ]);

        $this->assertTrue($conversation->messages->contains($message));
        $this->assertInstanceOf(Message::class, $conversation->messages->first());
    }

    public function test_get_other_user_returns_user2_when_given_user1(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $otherUser = $conversation->getOtherUser($user1);

        $this->assertEquals($user2->id, $otherUser->id);
    }

    public function test_get_other_user_returns_user1_when_given_user2(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $otherUser = $conversation->getOtherUser($user2);

        $this->assertEquals($user1->id, $otherUser->id);
    }

    public function test_get_last_message_returns_most_recent_message(): void
    {
        $conversation = Conversation::factory()->create();
        
        // Create messages with different timestamps
        $message1 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'created_at' => now()->subHours(2),
        ]);
        $message2 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'created_at' => now()->subHour(),
        ]);
        $message3 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'created_at' => now(),
        ]);

        $lastMessage = $conversation->getLastMessage();

        $this->assertNotNull($lastMessage);
        $this->assertEquals($message3->id, $lastMessage->id);
    }

    public function test_get_last_message_returns_null_when_no_messages(): void
    {
        $conversation = Conversation::factory()->create();

        $lastMessage = $conversation->getLastMessage();

        $this->assertNull($lastMessage);
    }

    public function test_get_unread_count_returns_correct_count_for_user(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        // Create 3 unread messages for user1
        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user2->id,
            'recipient_id' => $user1->id,
            'read' => false,
        ]);

        // Create 2 read messages for user1
        Message::factory()->count(2)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user2->id,
            'recipient_id' => $user1->id,
            'read' => true,
        ]);

        // Create 1 unread message for user2
        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user1->id,
            'recipient_id' => $user2->id,
            'read' => false,
        ]);

        $unreadCountUser1 = $conversation->getUnreadCount($user1);
        $unreadCountUser2 = $conversation->getUnreadCount($user2);

        $this->assertEquals(3, $unreadCountUser1);
        $this->assertEquals(1, $unreadCountUser2);
    }

    public function test_get_unread_count_returns_zero_when_all_messages_read(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        // Create only read messages
        Message::factory()->count(5)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user2->id,
            'recipient_id' => $user1->id,
            'read' => true,
        ]);

        $unreadCount = $conversation->getUnreadCount($user1);

        $this->assertEquals(0, $unreadCount);
    }

    public function test_get_unread_count_returns_zero_when_no_messages(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $unreadCount = $conversation->getUnreadCount($user1);

        $this->assertEquals(0, $unreadCount);
    }

    public function test_conversation_uses_uuid_primary_key(): void
    {
        $conversation = Conversation::factory()->create();

        $this->assertIsString($conversation->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $conversation->id
        );
    }

    public function test_conversation_has_timestamps(): void
    {
        $conversation = Conversation::factory()->create();

        $this->assertNotNull($conversation->created_at);
        $this->assertNotNull($conversation->updated_at);
    }

    public function test_conversation_fillable_attributes(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $shipment = Shipment::factory()->create();

        $conversation = Conversation::create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
            'shipment_id' => $shipment->id,
        ]);

        $this->assertEquals($user1->id, $conversation->user1_id);
        $this->assertEquals($user2->id, $conversation->user2_id);
        $this->assertEquals($shipment->id, $conversation->shipment_id);
    }
}
