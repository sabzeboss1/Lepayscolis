<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public User $user,
        public string $title,
        public string $body,
        public array $data = []
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!$this->user->fcm_token) {
            Log::warning('Cannot send push notification - no FCM token', [
                'user_id' => $this->user->id,
            ]);
            return;
        }

        $fcmServerKey = config('services.fcm.server_key');
        
        if (!$fcmServerKey) {
            Log::error('FCM server key not configured');
            return;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $fcmServerKey,
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'to' => $this->user->fcm_token,
                'notification' => [
                    'title' => $this->title,
                    'body' => $this->body,
                    'sound' => 'default',
                ],
                'data' => $this->data,
                'priority' => 'high',
            ]);

            if ($response->successful()) {
                Log::info('Push notification sent successfully', [
                    'user_id' => $this->user->id,
                    'title' => $this->title,
                ]);
            } else {
                Log::error('FCM API error', [
                    'user_id' => $this->user->id,
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send push notification', [
                'user_id' => $this->user->id,
                'title' => $this->title,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
