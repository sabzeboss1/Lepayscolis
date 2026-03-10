'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Channel } from 'pusher-js';
import { usePusher } from './PusherContext';

/**
 * Hook to subscribe to a channel and listen to events
 * Automatically handles cleanup on unmount
 */
export function useChannel(channelName: string | null) {
  const { subscribe, unsubscribe } = usePusher();
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!channelName) {
      return;
    }

    // Subscribe to channel
    const channel = subscribe(channelName);
    channelRef.current = channel;

    // Cleanup on unmount or channel change
    return () => {
      if (channelName) {
        unsubscribe(channelName);
      }
      channelRef.current = null;
    };
  }, [channelName, subscribe, unsubscribe]);

  return channelRef.current;
}

/**
 * Hook to subscribe to a private channel and listen to events
 * Automatically handles cleanup on unmount
 */
export function usePrivateChannel(channelName: string | null) {
  const { subscribeToPrivateChannel, unsubscribe } = usePusher();
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!channelName) {
      return;
    }

    // Ensure channel name starts with 'private-'
    const privateChannelName = channelName.startsWith('private-')
      ? channelName
      : `private-${channelName}`;

    // Subscribe to private channel
    const channel = subscribeToPrivateChannel(privateChannelName);
    channelRef.current = channel;

    // Cleanup on unmount or channel change
    return () => {
      if (privateChannelName) {
        unsubscribe(privateChannelName);
      }
      channelRef.current = null;
    };
  }, [channelName, subscribeToPrivateChannel, unsubscribe]);

  return channelRef.current;
}

/**
 * Hook to listen to a specific event on a channel
 * Automatically binds and unbinds the event handler
 */
export function useChannelEvent<T = any>(
  channelName: string | null,
  eventName: string,
  callback: (data: T) => void
) {
  const channel = useChannel(channelName);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!channel || !eventName) {
      return;
    }

    // Bind event handler
    const handler = (data: T) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    // Cleanup: unbind event handler
    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channel, eventName]);
}

/**
 * Hook to listen to a specific event on a private channel
 * Automatically binds and unbinds the event handler
 */
export function usePrivateChannelEvent<T = any>(
  channelName: string | null,
  eventName: string,
  callback: (data: T) => void
) {
  const channel = usePrivateChannel(channelName);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!channel || !eventName) {
      return;
    }

    // Bind event handler
    const handler = (data: T) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    // Cleanup: unbind event handler
    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channel, eventName]);
}

/**
 * Hook to subscribe to user-specific notifications channel
 * Listens to notification.created events
 */
export function useUserNotifications(
  userId: string | null,
  onNotification: (notification: any) => void
) {
  const channelName = userId ? `user.${userId}` : null;
  
  usePrivateChannelEvent(
    channelName,
    'notification.created',
    onNotification
  );
}

/**
 * Hook to subscribe to conversation messages channel
 * Listens to message.sent events
 */
export function useConversationMessages(
  conversationId: string | null,
  onMessage: (message: any) => void
) {
  const channelName = conversationId ? `conversation.${conversationId}` : null;
  
  usePrivateChannelEvent(
    channelName,
    'message.sent',
    onMessage
  );
}

/**
 * Hook to subscribe to shipment status updates
 * Listens to shipment.status_updated events
 */
export function useShipmentStatusUpdates(
  shipmentId: string | null,
  onStatusUpdate: (data: { shipment_id: string; status: string }) => void
) {
  const channelName = shipmentId ? `shipment.${shipmentId}` : null;
  
  usePrivateChannelEvent(
    channelName,
    'shipment.status_updated',
    onStatusUpdate
  );
}

/**
 * Hook to subscribe to trip status updates
 * Listens to trip.status_updated events
 */
export function useTripStatusUpdates(
  tripId: string | null,
  onStatusUpdate: (data: { trip_id: string; status: string }) => void
) {
  const channelName = tripId ? `trip.${tripId}` : null;
  
  usePrivateChannelEvent(
    channelName,
    'trip.status_updated',
    onStatusUpdate
  );
}

/**
 * Hook to subscribe to payment status updates
 * Listens to payment.status_updated events
 */
export function usePaymentStatusUpdates(
  userId: string | null,
  onStatusUpdate: (data: { payment_id: string; status: string }) => void
) {
  const channelName = userId ? `user.${userId}` : null;
  
  usePrivateChannelEvent(
    channelName,
    'payment.status_updated',
    onStatusUpdate
  );
}

/**
 * Hook to subscribe to wallet balance updates
 * Listens to wallet.balance_updated events
 */
export function useWalletBalanceUpdates(
  userId: string | null,
  onBalanceUpdate: (data: { balance: number }) => void
) {
  const channelName = userId ? `user.${userId}` : null;
  
  usePrivateChannelEvent(
    channelName,
    'wallet.balance_updated',
    onBalanceUpdate
  );
}
