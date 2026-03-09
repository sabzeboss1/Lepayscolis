<?php

namespace App\Observers;

use App\Events\MessageSent;
use App\Models\Message;
use App\Services\NotificationService;

class MessageObserver
{
    /**
     * Handle the Message "created" event.
     * Broadcast MessageSent event and send push notification to recipient.
     */
    public function created(Message $message): void
    {
        // Broadcast MessageSent event via WebSocket (Pusher)
        event(new MessageSent($message));

        // Send push notification to recipient via FCM
        $notificationService = app(NotificationService::class);
        $notificationService->sendPush(
            $message->recipient,
            __('notifications.new_message', [], $message->recipient->locale ?? 'fr'),
            substr($message->content, 0, 100),
            ['conversation_id' => $message->conversation_id]
        );
    }
}
