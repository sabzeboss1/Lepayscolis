<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationMessageMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_conversations_table_has_correct_columns(): void
    {
        $this->assertTrue(
            \Schema::hasTable('conversations'),
            'Conversations table does not exist'
        );

        $columns = ['id', 'user1_id', 'user2_id', 'shipment_id', 'created_at', 'updated_at'];

        foreach ($columns as $column) {
            $this->assertTrue(
                \Schema::hasColumn('conversations', $column),
                "Conversations table is missing column: {$column}"
            );
        }
    }

    public function test_messages_table_has_correct_columns(): void
    {
        $this->assertTrue(
            \Schema::hasTable('messages'),
            'Messages table does not exist'
        );

        $columns = [
            'id',
            'conversation_id',
            'sender_id',
            'recipient_id',
            'content',
            'read',
            'read_at',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                \Schema::hasColumn('messages', $column),
                "Messages table is missing column: {$column}"
            );
        }
    }

    public function test_can_create_conversation_between_two_users(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $conversation = Conversation::create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);
    }

    public function test_conversation_has_unique_constraint_on_users(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        Conversation::create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Conversation::create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);
    }

    public function test_conversation_can_be_linked_to_shipment(): void
    {
        $shipment = Shipment::factory()->create();
        $conversation = Conversation::factory()->create([
            'shipment_id' => $shipment->id,
        ]);

        $this->assertInstanceOf(Shipment::class, $conversation->shipment);
        $this->assertEquals($shipment->id, $conversation->shipment->id);
    }

    public function test_conversation_has_user_relationships(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $this->assertInstanceOf(User::class, $conversation->user1);
        $this->assertInstanceOf(User::class, $conversation->user2);
        $this->assertEquals($user1->id, $conversation->user1->id);
        $this->assertEquals($user2->id, $conversation->user2->id);
    }

    public function test_conversation_get_other_user_method(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::create([
            'user1_id' => $user1->id,
            'user2_id' => $user2->id,
        ]);

        $otherUser = $conversation->getOtherUser($user1);
        $this->assertEquals($user2->id, $otherUser->id);

        $otherUser = $conversation->getOtherUser($user2);
        $this->assertEquals($user1->id, $otherUser->id);
    }

    public function test_can_create_message_in_conversation(): void
    {
        $conversation = Conversation::factory()->create();

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $conversation->user1_id,
            'recipient_id' => $conversation->user2_id,
            'content' => 'Test message',
            'read' => false,
        ]);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'conversation_id' => $conversation->id,
            'content' => 'Test message',
        ]);
    }

    public function test_message_has_relationships(): void
    {
        $conversation = Conversation::factory()->create();
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $conversation->user1_id,
            'recipient_id' => $conversation->user2_id,
        ]);

        $this->assertInstanceOf(Conversation::class, $message->conversation);
        $this->assertInstanceOf(User::class, $message->sender);
        $this->assertInstanceOf(User::class, $message->recipient);
    }

    public function test_message_defaults_to_unread(): void
    {
        $message = Message::factory()->create();

        $this->assertFalse($message->read);
        $this->assertNull($message->read_at);
    }

    public function test_message_can_be_marked_as_read(): void
    {
        $message = Message::factory()->create();

        $message->update([
            'read' => true,
            'read_at' => now(),
        ]);

        $this->assertTrue($message->read);
        $this->assertNotNull($message->read_at);
    }

    public function test_conversation_get_last_message_method(): void
    {
        $conversation = Conversation::factory()->create();
        
        $message1 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'created_at' => now()->subHours(2),
        ]);
        
        $message2 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'created_at' => now()->subHour(),
        ]);

        $lastMessage = $conversation->getLastMessage();
        $this->assertEquals($message2->id, $lastMessage->id);
    }

    public function test_conversation_get_unread_count_method(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::create([
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

        // Create 1 read message for user1
        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user2->id,
            'recipient_id' => $user1->id,
            'read' => true,
        ]);

        $unreadCount = $conversation->getUnreadCount($user1);
        $this->assertEquals(3, $unreadCount);
    }

    public function test_conversation_has_messages_relationship(): void
    {
        $conversation = Conversation::factory()->create();
        Message::factory()->count(5)->create([
            'conversation_id' => $conversation->id,
        ]);

        $this->assertCount(5, $conversation->messages);
    }
}
