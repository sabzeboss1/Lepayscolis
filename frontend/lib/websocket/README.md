# WebSocket Real-Time Communication (Pusher)

This directory contains the WebSocket implementation using Pusher for real-time communication between the frontend and backend.

## Architecture

The WebSocket layer is built on top of Pusher and provides:

1. **PusherContext**: Global Pusher connection management
2. **Custom Hooks**: Easy-to-use hooks for subscribing to channels and events
3. **Real-time Integration**: Automatic handling of notifications, messages, and status updates
4. **Toast Notifications**: Visual feedback for real-time events

## Setup

### 1. Environment Variables

Add the following to your `.env.local`:

```env
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Provider Setup

The `PusherProvider` is already integrated in `app/providers.tsx`:

```tsx
<PusherProvider>
  <NotificationProvider>
    {children}
  </NotificationProvider>
</PusherProvider>
```

### 3. Enable Real-time Features

The `RealtimeIntegration` component is added to the app layout to enable real-time notifications automatically.

## Usage

### Basic Channel Subscription

```tsx
import { useChannel, useChannelEvent } from '@/lib/websocket';

function MyComponent() {
  const channel = useChannel('my-channel');
  
  useChannelEvent('my-channel', 'my-event', (data) => {
    console.log('Event received:', data);
  });
  
  return <div>Listening to events...</div>;
}
```

### Private Channel Subscription

```tsx
import { usePrivateChannel, usePrivateChannelEvent } from '@/lib/websocket';

function MyComponent() {
  const userId = '123';
  const channelName = `user.${userId}`;
  
  usePrivateChannelEvent(channelName, 'notification.created', (notification) => {
    console.log('New notification:', notification);
  });
  
  return <div>Listening to private channel...</div>;
}
```

### Real-time Notifications

Notifications are automatically displayed as toast messages when received:

```tsx
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications';

function MyComponent() {
  // Automatically subscribes to user notifications and displays toasts
  useRealtimeNotifications();
  
  return <div>Real-time notifications enabled</div>;
}
```

### Real-time Messages

```tsx
import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages';

function ConversationView({ conversationId }) {
  const [messages, setMessages] = useState([]);
  
  useRealtimeMessages({
    conversationId,
    onNewMessage: (message) => {
      setMessages(prev => [...prev, message]);
    },
  });
  
  return <div>{/* Render messages */}</div>;
}
```

### Real-time Status Updates

```tsx
import { useRealtimeShipmentStatus } from '@/lib/hooks/useRealtimeStatusUpdates';

function ShipmentDetails({ shipmentId }) {
  const [status, setStatus] = useState('pending');
  
  useRealtimeShipmentStatus(shipmentId, (data) => {
    setStatus(data.status);
    // Show notification
    NotificationService.info(`Shipment status updated to: ${data.status}`);
  });
  
  return <div>Status: {status}</div>;
}
```

### Real-time Wallet Balance

```tsx
import { useRealtimeWallet } from '@/lib/hooks/useRealtimeWallet';

function WalletBalance() {
  const [balance, setBalance] = useState(0);
  
  useRealtimeWallet((data) => {
    setBalance(data.balance);
    NotificationService.success(`Wallet updated: ${data.balance} EUR`);
  });
  
  return <div>Balance: {balance} EUR</div>;
}
```

## Available Channels

### User-Specific Channels

- `private-user.{userId}`: User-specific notifications, payment updates, wallet updates

### Resource-Specific Channels

- `private-conversation.{conversationId}`: Conversation messages
- `private-shipment.{shipmentId}`: Shipment status updates
- `private-trip.{tripId}`: Trip status updates

### Presence Channels

- `presence-admin`: Admin presence (for admin dashboard)

## Available Events

### Notification Events

- `notification.created`: New notification for user

### Message Events

- `message.sent`: New message in conversation
- `message.read`: Message marked as read

### Status Update Events

- `shipment.status_updated`: Shipment status changed
- `trip.status_updated`: Trip status changed
- `payment.status_updated`: Payment status changed

### Wallet Events

- `wallet.balance_updated`: Wallet balance changed

## Toast Notifications

The `NotificationService` provides methods to show toast notifications:

```tsx
import { NotificationService } from '@/lib/services/NotificationService';

// Success toast
NotificationService.success('Operation completed successfully');

// Error toast
NotificationService.error('An error occurred');

// Warning toast
NotificationService.warning('Please verify your information');

// Info toast
NotificationService.info('New message received');

// Custom toast with action
NotificationService.show({
  type: 'info',
  title: 'New Message',
  message: 'You have a new message from John',
  duration: 5000,
  action: {
    label: 'View',
    onClick: () => router.push('/messages'),
  },
});
```

## Backend Integration

The backend must be configured with Pusher and broadcast events on the appropriate channels. See `lepaysexpresscolis-backend/docs/TASK_12_WEBSOCKET_BROADCASTING_COMPLETE.md` for backend setup.

### Authentication Endpoint

Private channels require authentication. The backend must provide an endpoint at `/api/broadcasting/auth` that validates the user's token and authorizes channel access.

### Broadcasting Events

Backend events should be broadcast using Laravel's broadcasting system:

```php
// Example: Broadcasting a notification
broadcast(new NotificationCreated($notification))->toOthers();

// Example: Broadcasting a message
broadcast(new MessageSent($message))->toOthers();
```

## Testing

To test WebSocket functionality:

1. Start the backend server with Pusher configured
2. Start the frontend development server
3. Login as a user
4. Open browser console to see connection logs
5. Trigger events from the backend (e.g., send a message, update a status)
6. Verify that toast notifications appear

## Troubleshooting

### Connection Issues

- Verify Pusher credentials in `.env.local`
- Check that the backend broadcasting auth endpoint is accessible
- Ensure the user is authenticated (Pusher connects only for authenticated users)
- Check browser console for connection errors

### Events Not Received

- Verify channel name format (must match backend)
- Check that the backend is broadcasting events correctly
- Ensure the user has permission to access the private channel
- Check Pusher dashboard for event logs

### Toast Not Showing

- Verify `NotificationProvider` is in the component tree
- Check browser console for JavaScript errors
- Ensure the toast container is not hidden by CSS

## Performance Considerations

- Channels are automatically cleaned up when components unmount
- Only one Pusher connection is maintained per user session
- Channel subscriptions are reused when possible
- Toast notifications auto-dismiss after a configurable duration

## Security

- Private channels require backend authentication
- User can only subscribe to their own user channel
- Channel authorization is handled by the backend
- Sensitive data should not be broadcast in channel names

## Future Enhancements

- [ ] Add typing indicators for conversations
- [ ] Add presence indicators (online/offline status)
- [ ] Add read receipts for messages
- [ ] Add notification sound preferences
- [ ] Add notification history persistence
- [ ] Add offline queue for failed events
