import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { usePrivateChannelEvent } from '@/lib/websocket/hooks';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Conversation } from '@/lib/types/api';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (!user) return;
      
      // Only fetch if KYC is approved
      if (user.kyc_status !== 'approved') {
        setUnreadCount(0);
        return;
      }

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
      // Silently fail if KYC verification is required
      if (error instanceof Error && error.message.includes('KYC')) {
        setUnreadCount(0);
        return;
      }
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Fetch on mount
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
  }, [user?.id, fetchUnreadCount]);

  // Subscribe to real-time message events
  usePrivateChannelEvent(
    user ? `user.${user.id}` : null,
    'message.sent',
    () => {
      fetchUnreadCount();
    }
  );

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
}
