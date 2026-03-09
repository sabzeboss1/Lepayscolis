<?php

namespace Tests\Unit\Jobs;

use App\Jobs\SendPushNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SendPushNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_sends_push_notification_via_fcm(): void
    {
        Http::fake([
            'fcm.googleapis.com/*' => Http::response(['success' => 1], 200),
        ]);

        Config::set('services.fcm.server_key', 'test_server_key');

        $user = User::factory()->create(['fcm_token' => 'test_fcm_token']);
        $title = 'Test Title';
        $body = 'Test Body';
        $data = ['key' => 'value'];

        $job = new SendPushNotification($user, $title, $body, $data);
        $job->handle();

        Http::assertSent(function ($request) use ($user, $title, $body, $data) {
            return $request->url() === 'https://fcm.googleapis.com/fcm/send'
                && $request['to'] === $user->fcm_token
                && $request['notification']['title'] === $title
                && $request['notification']['body'] === $body
                && $request['data'] === $data
                && $request->hasHeader('Authorization', 'key=test_server_key');
        });
    }

    public function test_job_skips_when_user_has_no_fcm_token(): void
    {
        Http::fake();

        $user = User::factory()->create(['fcm_token' => null]);
        $job = new SendPushNotification($user, 'Title', 'Body');
        $job->handle();

        Http::assertNothingSent();
    }

    public function test_job_skips_when_fcm_server_key_not_configured(): void
    {
        Http::fake();
        Config::set('services.fcm.server_key', null);

        $user = User::factory()->create(['fcm_token' => 'test_token']);
        $job = new SendPushNotification($user, 'Title', 'Body');
        $job->handle();

        Http::assertNothingSent();
    }

    public function test_job_has_correct_retry_configuration(): void
    {
        $user = User::factory()->create();
        $job = new SendPushNotification($user, 'Title', 'Body');

        $this->assertEquals(3, $job->tries);
        $this->assertEquals(30, $job->timeout);
    }
}
