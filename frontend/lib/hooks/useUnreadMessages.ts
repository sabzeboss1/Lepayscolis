import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { usePusher } from '@/lib/websocket/PusherContext';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Conversation } from '@/lib/types/api';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { subscribe } = usePusher();

  const fetchUnreadCount = async () => {
    try {
      if (!user) return;

      const response = await apiClient.get<{ data: Conversation[] }>(
        API_ENDPOINTS.messages.conversations
      );

      const conversations = response.data || [];
      
      // Calculate total unread count
      const total = conversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0
      );
      
      setUnreadCount(total);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch immediately
    fetchUnreadCount();

    // Subscribe to real-time message events
    const unsubscribe = subscribe(
      `private-user.${user.id}`,
      'message.sent',
      () => {
        // Refresh unread count when new message arrives
        fetchUnreadCount();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
}
