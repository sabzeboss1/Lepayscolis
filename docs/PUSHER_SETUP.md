# Pusher WebSocket Broadcasting Setup

This document explains how to configure Pusher for real-time WebSocket broadcasting in the Le Pays Express Colis backend.

## Overview

Pusher is used for real-time WebSocket communication to enable:
- Real-time messaging between users
- Live shipment status updates
- Payment status notifications
- Instant notifications

## Installation

The Pusher PHP SDK is already installed via Composer:

```bash
composer require pusher/pusher-php-server
```

Package: `pusher/pusher-php-server` version `^7.2`

## Configuration

### 1. Get Pusher Credentials

1. Sign up for a free account at [https://pusher.com](https://pusher.com)
2. Create a new Channels app
3. Note down your credentials:
   - App ID
   - App Key
   - App Secret
   - Cluster (e.g., `mt1`, `eu`, `us2`)

### 2. Environment Variables

Add the following variables to your `.env` file:

```env
BROADCAST_CONNECTION=pusher

PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
```

### 3. Broadcasting Configuration

The broadcasting configuration is located at `config/broadcasting.php`. The Pusher connection is already configured:

```php
'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY'),
    'secret' => env('PUSHER_APP_SECRET'),
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'host' => env('PUSHER_HOST') ?: 'api-'.env('PUSHER_APP_CLUSTER', 'mt1').'.pusher.com',
        'port' => env('PUSHER_PORT', 443),
        'scheme' => env('PUSHER_SCHEME', 'https'),
        'encrypted' => true,
        'useTLS' => env('PUSHER_SCHEME', 'https') === 'https',
    ],
],
```

## Usage

### Broadcasting Events

To broadcast an event via Pusher, implement the `ShouldBroadcast` interface:

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $conversationId,
        public string $messageId,
        public string $content,
        public string $senderId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->conversationId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->messageId,
            'content' => $this->content,
            'sender_id' => $this->senderId,
            'created_at' => now()->toISOString(),
        ];
    }
}
```

### Private Channel Authentication

Define channel authorization in `routes/channels.php`:

```php
<?php

use Illuminate\Support\Facades\Broadcast;

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
```

## Channels Used in the Application

### 1. Conversation Channels
- **Channel**: `private-conversation.{conversationId}`
- **Purpose**: Real-time messaging between users
- **Events**: `MessageSent`
- **Authorization**: Only conversation participants (user1 or user2)

### 2. User Channels
- **Channel**: `private-user.{userId}`
- **Purpose**: User-specific notifications (shipment updates, payment status)
- **Events**: `ShipmentStatusChanged`, `PaymentStatusChanged`
- **Authorization**: Only the user themselves

## Testing

### Test Broadcasting Locally

1. Start the Laravel queue worker (events are queued by default):
```bash
php artisan queue:work
```

2. Trigger an event:
```php
event(new MessageSent($conversationId, $messageId, $content, $senderId));
```

3. Monitor Pusher Debug Console:
   - Go to your Pusher dashboard
   - Navigate to Debug Console
   - You should see the event being broadcast

### Test with Pusher Debug Console

The Pusher dashboard provides a real-time debug console where you can:
- See all events being broadcast
- View event payloads
- Monitor connection status
- Test channel subscriptions

## Frontend Integration

The frontend (Next.js) should use Pusher JS client to subscribe to channels:

```javascript
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  authEndpoint: '/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});

// Subscribe to conversation channel
const channel = pusher.subscribe(`private-conversation.${conversationId}`);
channel.bind('message.sent', (data) => {
  console.log('New message:', data);
});
```

## Requirements Validation

This setup satisfies the following requirements:

- **Requirement 5.5**: Messages broadcast via WebSocket to conversation channel
- **Requirement 9.13**: Multi-channel notification delivery via WebSocket
- **Requirements 7.1-7.17**: Real-time payment status updates
- **Requirements 9.1-9.14**: Real-time notification system

## Troubleshooting

### Events Not Broadcasting

1. Check that `BROADCAST_CONNECTION=pusher` in `.env`
2. Verify Pusher credentials are correct
3. Ensure queue worker is running: `php artisan queue:work`
4. Check Laravel logs: `storage/logs/laravel.log`
5. Check Pusher Debug Console for errors

### Authentication Failing

1. Verify `routes/channels.php` has correct authorization logic
2. Check that Sanctum token is being sent in Authorization header
3. Ensure user is authenticated before subscribing to private channels

### Connection Issues

1. Verify cluster is correct (e.g., `mt1`, `eu`, `us2`)
2. Check firewall settings allow WebSocket connections
3. Ensure HTTPS is used in production

## Production Considerations

1. **Queue Workers**: Run queue workers with supervisor to ensure events are processed
2. **Scaling**: Pusher handles scaling automatically, no additional configuration needed
3. **Monitoring**: Monitor Pusher usage in dashboard to stay within plan limits
4. **Security**: Never expose `PUSHER_APP_SECRET` to frontend
5. **Rate Limiting**: Implement rate limiting on broadcasting endpoints

## Resources

- [Pusher Documentation](https://pusher.com/docs)
- [Laravel Broadcasting Documentation](https://laravel.com/docs/11.x/broadcasting)
- [Pusher Channels Pricing](https://pusher.com/channels/pricing)
- [Pusher Debug Console](https://dashboard.pusher.com/)

## Next Steps

After completing this setup:
1. Implement message broadcasting (Phase 3, Task 12)
2. Set up private channel authentication
3. Create event classes for shipment and payment updates
4. Test real-time functionality with frontend integration
