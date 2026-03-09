<?php

namespace Tests\Feature;

use App\Jobs\SendEmailNotification;
use App\Jobs\SendPushNotification;
use App\Models\Conversation;
use App\Models\KYCDocument;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_creation_sends_push_notification(): void
    {
        Queue::fake();

        $sender = User::factory()->create();
        $recipient = User::factory()->create(['fcm_token' => 'test_token']);
        $conversation = Conversation::factory()->create([
            'user1_id' => $sender->id,
            'user2_id' => $recipient->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'content' => 'Test message',
            'read' => false,
        ]);

        Queue::assertPushed(SendPushNotification::class, function ($job) use ($recipient) {
            return $job->user->id === $recipient->id;
        });
    }

    public function test_kyc_approval_sends_email_notification(): void
    {
        Queue::fake();

        $user = User::factory()->create(['kyc_status' => 'pending']);
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Update status to approved
        $kycDocument->update(['status' => 'approved']);

        Queue::assertPushed(SendEmailNotification::class, function ($job) use ($user) {
            return $job->user->id === $user->id
                && $job->template === 'kyc_approved';
        });
    }

    public function test_kyc_rejection_sends_email_notification(): void
    {
        Queue::fake();

        $user = User::factory()->create(['kyc_status' => 'pending']);
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Update status to rejected
        $kycDocument->update([
            'status' => 'rejected',
            'rejection_reason' => 'Document not clear',
        ]);

        Queue::assertPushed(SendEmailNotification::class, function ($job) use ($user) {
            return $job->user->id === $user->id
                && $job->template === 'kyc_rejected'
                && isset($job->data['reason']);
        });
    }

    public function test_kyc_approval_creates_notification_record(): void
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $kycDocument->update(['status' => 'approved']);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'kyc_approved',
        ]);
    }

    public function test_kyc_rejection_creates_notification_record(): void
    {
        $user = User::factory()->create(['kyc_status' => 'pending']);
        $kycDocument = KYCDocument::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $kycDocument->update([
            'status' => 'rejected',
            'rejection_reason' => 'Document not clear',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'kyc_rejected',
        ]);
    }
}
