<?php

namespace Tests\Unit\Services;

use App\Jobs\SendEmailNotification;
use App\Jobs\SendPushNotification;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new NotificationService();
    }

    public function test_send_email_queues_email_notification_job(): void
    {
        Queue::fake();

        $user = User::factory()->create(['locale' => 'fr']);
        $template = 'kyc_approved';
        $data = ['test' => 'data'];

        $this->service->sendEmail($user, $template, $data);

        Queue::assertPushed(SendEmailNotification::class, function ($job) use ($user, $template, $data) {
            return $job->user->id === $user->id
                && $job->template === $template
                && $job->data === $data;
        });
    }

    public function test_send_push_queues_push_notification_job_when_user_has_fcm_token(): void
    {
        Queue::fake();

        $user = User::factory()->create(['fcm_token' => 'test_token']);
        $title = 'Test Title';
        $body = 'Test Body';
        $data = ['key' => 'value'];

        $this->service->sendPush($user, $title, $body, $data);

        Queue::assertPushed(SendPushNotification::class, function ($job) use ($user, $title, $body, $data) {
            return $job->user->id === $user->id
                && $job->title === $title
                && $job->body === $body
                && $job->data === $data;
        });
    }

    public function test_send_push_skips_when_user_has_no_fcm_token(): void
    {
        Queue::fake();

        $user = User::factory()->create(['fcm_token' => null]);
        $title = 'Test Title';
        $body = 'Test Body';

        $this->service->sendPush($user, $title, $body);

        Queue::assertNotPushed(SendPushNotification::class);
    }

    public function test_create_notification_stores_notification_in_database(): void
    {
        $user = User::factory()->create();
        $type = 'test_type';
        $title = 'Test Title';
        $body = 'Test Body';
        $data = ['key' => 'value'];

        $notification = $this->service->createNotification($user, $type, $title, $body, $data);

        $this->assertInstanceOf(Notification::class, $notification);
        $this->assertEquals($user->id, $notification->user_id);
        $this->assertEquals($type, $notification->type);
        $this->assertEquals($title, $notification->title);
        $this->assertEquals($body, $notification->body);
        $this->assertEquals($data, $notification->data);
        $this->assertNull($notification->read_at);

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'user_id' => $user->id,
            'type' => $type,
        ]);
    }

    public function test_create_notification_with_empty_data(): void
    {
        $user = User::factory()->create();
        $type = 'test_type';
        $title = 'Test Title';
        $body = 'Test Body';

        $notification = $this->service->createNotification($user, $type, $title, $body);

        $this->assertInstanceOf(Notification::class, $notification);
        $this->assertEquals([], $notification->data);
    }
}
