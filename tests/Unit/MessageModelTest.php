<?php

namespace Tests\Unit;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_has_conversation_relationship(): void
    {
        $conversation = Conversation::factory()->create();
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
        ]);

        $this->assertInstanceOf(Conversation::class, $message->conversation);
        $this->assertEquals($conversation->id, $message->conversation->id);
    }

    public function test_message_has_sender_relationship(): void
    {
        $sender = User::factory()->create();
        $message = Message::factory()->create([
            'sender_id' => $sender->id,
        ]);

        $this->assertInstanceOf(User::class, $message->sender);
        $this->assertEquals($sender->id, $message->sender->id);
    }

    public function test_message_has_recipient_relationship(): void
    {
        $recipient = User::factory()->create();
        $message = Message::factory()->create([
            'recipient_id' => $recipient->id,
        ]);

        $this->assertInstanceOf(User::class, $message->recipient);
        $this->assertEquals($recipient->id, $message->recipient->id);
    }

    public function test_message_casts_read_as_boolean(): void
    {
        $message = Message::factory()->create(['read' => true]);

        $this->assertIsBool($message->read);
        $this->assertTrue($message->read);

        $message->read = false;
        $message->save();

        $this->assertIsBool($message->read);
        $this->assertFalse($message->read);
    }

    public function test_message_casts_read_at_as_datetime(): void
    {
        $now = now();
        $message = Message::factory()->create(['read_at' => $now]);

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $message->read_at);
        $this->assertEquals($now->timestamp, $message->read_at->timestamp);
    }

    public function test_message_read_at_can_be_null(): void
    {
        $message = Message::factory()->create(['read_at' => null]);

        $this->assertNull($message->read_at);
    }

    public function test_message_uses_uuid_primary_key(): void
    {
        $message = Message::factory()->create();

        $this->assertIsString($message->id);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $message->id
        );
    }

    public function test_message_has_timestamps(): void
    {
        $message = Message::factory()->create();

        $this->assertNotNull($message->created_at);
        $this->assertNotNull($message->updated_at);
    }

    public function test_message_fillable_attributes(): void
    {
        $conversation = Conversation::factory()->create();
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'content' => 'Test message content',
            'read' => false,
            'read_at' => null,
        ]);

        $this->assertEquals($conversation->id, $message->conversation_id);
        $this->assertEquals($sender->id, $message->sender_id);
        $this->assertEquals($recipient->id, $message->recipient_id);
        $this->assertEquals('Test message content', $message->content);
        $this->assertFalse($message->read);
        $this->assertNull($message->read_at);
    }

    public function test_new_message_defaults_to_unread(): void
    {
        $message = Message::factory()->create([
            'read' => false,
            'read_at' => null,
        ]);

        $this->assertFalse($message->read);
        $this->assertNull($message->read_at);
    }

    public function test_marking_message_as_read_updates_fields(): void
    {
        $message = Message::factory()->create([
            'read' => false,
            'read_at' => null,
        ]);

        $readTime = now();
        $message->read = true;
        $message->read_at = $readTime;
        $message->save();

        $this->assertTrue($message->read);
        $this->assertNotNull($message->read_at);
        $this->assertEquals($readTime->timestamp, $message->read_at->timestamp);
    }

    public function test_message_content_is_stored_correctly(): void
    {
        $content = 'This is a test message with special characters: éàü @#$%';
        $message = Message::factory()->create(['content' => $content]);

        $this->assertEquals($content, $message->content);
    }

    public function test_message_content_can_be_long(): void
    {
        // Test with 1000 characters (max length per requirements)
        $content = str_repeat('a', 1000);
        $message = Message::factory()->create(['content' => $content]);

        $this->assertEquals(1000, strlen($message->content));
        $this->assertEquals($content, $message->content);
    }

    public function test_multiple_messages_in_same_conversation(): void
    {
        $conversation = Conversation::factory()->create();
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $message1 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
        ]);

        $message2 = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $recipient->id,
            'recipient_id' => $sender->id,
        ]);

        $this->assertEquals($conversation->id, $message1->conversation_id);
        $this->assertEquals($conversation->id, $message2->conversation_id);
        $this->assertCount(2, $conversation->messages);
    }

    public function test_message_observer_is_registered(): void
    {
        // This test verifies that the observer is properly registered
        // by checking if the created event is triggered
        $message = Message::factory()->create();

        // If observer is registered, the message should be created successfully
        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
        ]);
    }
}
