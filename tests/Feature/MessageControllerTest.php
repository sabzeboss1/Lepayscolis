<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageControllerTest extends TestCase
{
    use RefreshDatabase;

    // ========== Conversations Tests ==========

    public function test_user_can_get_their_conversations(): void
    {
        $user = User::factory()->create();
        $otherUser1 = User::factory()->create();
        $otherUser2 = User::factory()->create();

        // Create conversations
        $conversation1 = Conversation::create([
            'user1_id' => min($user->id, $otherUser1->id),
            'user2_id' => max($user->id, $otherUser1->id),
        ]);

        $conversation2 = Conversation::create([
            'user1_id' => min($user->id, $otherUser2->id),
            'user2_id' => max($user->id, $otherUser2->id),
        ]);

        // Create messages
        Message::factory()->create([
            'conversation_id' => $conversation1->id,
            'sender_id' => $user->id,
            'recipient_id' => $otherUser1->id,
        ]);

        Message::factory()->create([
            'conversation_id' => $conversation2->id,
            'sender_id' => $otherUser2->id,
            'recipient_id' => $user->id,
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/messages/conversations');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'other_user',
                        'last_message',
                        'unread_count',
                    ],
                ],
            ]);
    }

    public function test_conversations_are_ordered_by_most_recent_message(): void
    {
        $user = User::factory()->create();
        $otherUser1 = User::factory()->create();
        $otherUser2 = User::factory()->create();

        $conversation1 = Conversation::create([
            'user1_id' => min($user->id, $otherUser1->id),
            'user2_id' => max($user->id, $otherUser1->id),
        ]);

        $conversation2 = Conversation::create([
            'user1_id' => min($user->id, $otherUser2->id),
            'user2_id' => max($user->id, $otherUser2->id),
        ]);

        // Create older message in conversation1
        Message::factory()->create([
            'conversation_id' => $conversation1->id,
            'sender_id' => $user->id,
            'recipient_id' => $otherUser1->id,
            'created_at' => now()->subHours(2),
        ]);

        // Create newer message in conversation2
        Message::factory()->create([
            'conversation_id' => $conversation2->id,
            'sender_id' => $otherUser2->id,
            'recipient_id' => $user->id,
            'created_at' => now()->subHour(),
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/messages/conversations');

        $response->assertStatus(200);
        
        $conversations = $response->json('data');
        $this->assertEquals($conversation2->id, $conversations[0]['id']);
        $this->assertEquals($conversation1->id, $conversations[1]['id']);
    }

    public function test_unauthenticated_user_cannot_get_conversations(): void
    {
        $response = $this->getJson('/api/messages/conversations');

        $response->assertStatus(401);
    }

    // ========== Get Messages Tests ==========

    public function test_user_can_get_messages_in_conversation(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Ensure user1_id < user2_id for consistency
        $user1Id = min($user->id, $otherUser->id);
        $user2Id = max($user->id, $otherUser->id);

        $conversation = Conversation::create([
            'user1_id' => $user1Id,
            'user2_id' => $user2Id,
        ]);

        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'recipient_id' => $otherUser->id,
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson("/api/messages/{$conversation->id}");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'content',
                        'sender',
                        'recipient',
                        'read',
                        'created_at',
                    ],
                ],
            ]);
    }

    public function test_messages_are_paginated(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Ensure user1_id < user2_id for consistency
        $user1Id = min($user->id, $otherUser->id);
        $user2Id = max($user->id, $otherUser->id);

        $conversation = Conversation::create([
            'user1_id' => $user1Id,
            'user2_id' => $user2Id,
        ]);

        Message::factory()->count(60)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'recipient_id' => $otherUser->id,
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson("/api/messages/{$conversation->id}");

        $response->assertStatus(200)
            ->assertJsonCount(50, 'data')
            ->assertJsonStructure([
                'data',
                'links',
                'meta',
            ]);
    }

    public function test_user_cannot_get_messages_from_other_users_conversation(): void
    {
        $user = User::factory()->create();
        $otherUser1 = User::factory()->create();
        $otherUser2 = User::factory()->create();

        $conversation = Conversation::create([
            'user1_id' => min($otherUser1->id, $otherUser2->id),
            'user2_id' => max($otherUser1->id, $otherUser2->id),
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson("/api/messages/{$conversation->id}");

        $response->assertStatus(403);
    }

    public function test_returns_404_for_nonexistent_conversation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/messages/nonexistent-uuid');

        $response->assertStatus(404);
    }

    // ========== Send Message Tests ==========

    public function test_user_can_send_message(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $this->actingAs($sender, 'sanctum');

        $response = $this->postJson('/api/messages', [
            'recipient_id' => $recipient->id,
            'content' => 'Hello, this is a test message.',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'content',
                    'sender',
                    'recipient',
                ],
            ]);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'content' => 'Hello, this is a test message.',
            'read' => false,
        ]);
    }

    public function test_sending_first_message_creates_conversation(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $this->actingAs($sender, 'sanctum');

        $this->assertDatabaseCount('conversations', 0);

        $response = $this->postJson('/api/messages', [
            'recipient_id' => $recipient->id,
            'content' => 'First message',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseHas('conversations', [
            'user1_id' => min($sender->id, $recipient->id),
            'user2_id' => max($sender->id, $recipient->id),
        ]);
    }

    public function test_sending_subsequent_messages_uses_existing_conversation(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $conversation = Conversation::create([
            'user1_id' => min($sender->id, $recipient->id),
            'user2_id' => max($sender->id, $recipient->id),
        ]);

        $this->actingAs($sender, 'sanctum');

        $response = $this->postJson('/api/messages', [
            'recipient_id' => $recipient->id,
            'content' => 'Second message',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseCount('conversations', 1);
        
        $message = Message::latest()->first();
        $this->assertEquals($conversation->id, $message->conversation_id);
    }

    public function test_conversation_uniqueness_constraint(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $this->actingAs($user1, 'sanctum');

        // Send first message
        $this->postJson('/api/messages', [
            'recipient_id' => $user2->id,
            'content' => 'First message',
        ]);

        // Send second message
        $this->postJson('/api/messages', [
            'recipient_id' => $user2->id,
            'content' => 'Second message',
        ]);

        // Should only have one conversation
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_cannot_send_message_to_self(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/messages', [
            'recipient_id' => $user->id,
            'content' => 'Message to myself',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['recipient_id']);
    }

    public function test_unauthenticated_user_cannot_send_message(): void
    {
        $recipient = User::factory()->create();

        $response = $this->postJson('/api/messages', [
            'recipient_id' => $recipient->id,
            'content' => 'Hello',
        ]);

        $response->assertStatus(401);
    }

    // ========== Mark as Read Tests ==========

    public function test_recipient_can_mark_message_as_read(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        // Ensure user1_id < user2_id for consistency
        $user1Id = min($sender->id, $recipient->id);
        $user2Id = max($sender->id, $recipient->id);

        $conversation = Conversation::create([
            'user1_id' => $user1Id,
            'user2_id' => $user2Id,
        ]);

        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'read' => false,
        ]);

        $this->actingAs($recipient, 'sanctum');

        $response = $this->patchJson("/api/messages/{$message->id}/mark-read");

        $response->assertStatus(200);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'read' => true,
        ]);

        $message->refresh();
        $this->assertNotNull($message->read_at);
    }

    public function test_sender_cannot_mark_message_as_read(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $conversation = Conversation::create([
            'user1_id' => min($sender->id, $recipient->id),
            'user2_id' => max($sender->id, $recipient->id),
        ]);

        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'read' => false,
        ]);

        $this->actingAs($sender, 'sanctum');

        $response = $this->patchJson("/api/messages/{$message->id}/mark-read");

        $response->assertStatus(403);
    }

    // ========== Unread Count Tests ==========

    public function test_user_can_get_unread_message_count(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $conversation = Conversation::create([
            'user1_id' => min($user->id, $otherUser->id),
            'user2_id' => max($user->id, $otherUser->id),
        ]);

        // Create 3 unread messages
        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $otherUser->id,
            'recipient_id' => $user->id,
            'read' => false,
        ]);

        // Create 2 read messages
        Message::factory()->count(2)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $otherUser->id,
            'recipient_id' => $user->id,
            'read' => true,
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/messages/unread-count');

        $response->assertStatus(200)
            ->assertJson([
                'unread_count' => 3,
            ]);
    }

    public function test_unread_count_only_includes_user_messages(): void
    {
        $user = User::factory()->create();
        $otherUser1 = User::factory()->create();
        $otherUser2 = User::factory()->create();

        $conversation1 = Conversation::create([
            'user1_id' => min($user->id, $otherUser1->id),
            'user2_id' => max($user->id, $otherUser1->id),
        ]);

        $conversation2 = Conversation::create([
            'user1_id' => min($otherUser1->id, $otherUser2->id),
            'user2_id' => max($otherUser1->id, $otherUser2->id),
        ]);

        // Messages for user
        Message::factory()->count(2)->create([
            'conversation_id' => $conversation1->id,
            'sender_id' => $otherUser1->id,
            'recipient_id' => $user->id,
            'read' => false,
        ]);

        // Messages for other users
        Message::factory()->count(3)->create([
            'conversation_id' => $conversation2->id,
            'sender_id' => $otherUser1->id,
            'recipient_id' => $otherUser2->id,
            'read' => false,
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/messages/unread-count');

        $response->assertStatus(200)
            ->assertJson([
                'unread_count' => 2,
            ]);
    }
}
