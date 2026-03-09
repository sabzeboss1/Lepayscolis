<?php

namespace Tests\Unit\Jobs;

use App\Jobs\SendEmailNotification;
use App\Mail\KYCApproved;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendEmailNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_sends_email_with_correct_mailable(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'locale' => 'fr',
        ]);
        $template = 'kyc_approved';
        $data = [];

        $job = new SendEmailNotification($user, $template, $data);
        $job->handle();

        Mail::assertSent(KYCApproved::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email)
                && $mail->user->id === $user->id;
        });
    }

    public function test_job_does_not_send_email_for_unknown_template(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $template = 'unknown_template';
        $data = [];

        $job = new SendEmailNotification($user, $template, $data);
        $job->handle();

        Mail::assertNothingSent();
    }

    public function test_job_has_correct_retry_configuration(): void
    {
        $user = User::factory()->create();
        $job = new SendEmailNotification($user, 'kyc_approved', []);

        $this->assertEquals(3, $job->tries);
        $this->assertEquals(60, $job->timeout);
    }
}
