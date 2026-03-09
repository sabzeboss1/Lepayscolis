<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Conversation channel - only participants can listen
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = \App\Models\Conversation::find($conversationId);
    
    return $conversation && (
        $conversation->user1_id === $user->id || 
        $conversation->user2_id === $user->id
    );
});

// User channel - only the user can listen to their own channel
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user->id === $userId;
});
