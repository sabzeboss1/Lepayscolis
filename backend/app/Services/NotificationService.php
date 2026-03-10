<?php

namespace App\Services;

use App\Jobs\SendEmailNotification;
use App\Jobs\SendPushNotification;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send an email notification to a user.
     * Queues the email for async processing with user's locale.
     */
    public function sendEmail(User $user, string $template, array $data): void
    {
        try {
            SendEmailNotification::dispatch($user, $template, $data);
            
            Log::info('Email notification queued', [
                'user_id' => $user->id,
                'template' => $template,
                'locale' => $user->locale,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue email notification', [
                'user_id' => $user->id,
                'template' => $template,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send a push notification to a user via FCM.
     * Queues the push notification for async processing.
     */
    public function sendPush(User $user, string $title, string $body, array $data = []): void
    {
        // Only send if user has FCM token
        if (!$user->fcm_token) {
            Log::info('Push notification skipped - no FCM token', [
                'user_id' => $user->id,
            ]);
            return;
        }

        try {
            SendPushNotification::dispatch($user, $title, $body, $data);
            
            Log::info('Push notification queued', [
                'user_id' => $user->id,
                'title' => $title,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue push notification', [
                'user_id' => $user->id,
                'title' => $title,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Broadcast a WebSocket event via Pusher.
     * This is handled by Laravel's event broadcasting system.
     */
    public function broadcast(string $channel, string $event, array $data): void
    {
        try {
            broadcast(new \Illuminate\Broadcasting\BroadcastEvent($channel, $event, $data));
            
            Log::info('WebSocket event broadcast', [
                'channel' => $channel,
                'event' => $event,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast WebSocket event', [
                'channel' => $channel,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Create a notification record in the database.
     * Stores notification for in-app display.
     */
    public function createNotification(User $user, string $type, string $title, string $body, array $data = []): Notification
    {
        try {
            $notification = Notification::create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'data' => $data,
            ]);

            Log::info('Notification created', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'type' => $type,
            ]);

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
