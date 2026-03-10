'use client';

import { useCallback } from 'react';
import { useConversationMessages } from '@/lib/websocket/hooks';
import { Message } from '@/lib/types/message';

interface UseRealtimeMessagesOptions {
  conversationId: string | null;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
}

/**
 * Hook to listen to real-time messages in a conversation
 */
export function useRealtimeMessages({
  conversationId,
  onNewMessage,
  onMessageRead,
}: UseRealtimeMessagesOptions) {
  // Listen to new messages
  useConversationMessages(
    conversationId,
    useCallback(
      (message: Message) => {
        if (onNewMessage) {
          onNewMessage(message);
        }
      },
      [onNewMessage]
    )
  );

  // You can add more event listeners here for message.read, message.deleted, etc.
}
