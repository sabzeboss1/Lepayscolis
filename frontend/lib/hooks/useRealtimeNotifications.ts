'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePrivateChannelEvent } from '@/lib/websocket/hooks';
import { NotificationService } from '@/lib/services/NotificationService';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Hook to listen to real-time notifications and display them as toasts
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();

  usePrivateChannelEvent<NotificationData>(
    user?.id ? `user.${user.id}` : null,
    'notification.created',
    (notification) => {
      // Map notification type to toast type
      let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
      
      if (notification.type.includes('success') || notification.type.includes('approved')) {
        toastType = 'success';
      } else if (notification.type.includes('error') || notification.type.includes('failed') || notification.type.includes('rejected')) {
        toastType = 'error';
      } else if (notification.type.includes('warning') || notification.type.includes('pending')) {
        toastType = 'warning';
      }

      // Determine duration based on priority
      let duration = 5000; // Default 5 seconds
      if (notification.priority === 'high') {
        duration = 10000; // 10 seconds for high priority
        
        // Play sound for high priority notifications
        if (typeof window !== 'undefined' && 'Audio' in window) {
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Ignore errors if sound can't be played
            });
          } catch (error) {
            // Ignore errors
          }
        }
      } else if (notification.priority === 'low') {
        duration = 3000; // 3 seconds for low priority
      }

      // Show toast notification
      NotificationService.show({
        type: toastType,
        title: notification.title,
        message: notification.message,
        duration,
        action: notification.data?.action_url ? {
          label: notification.data?.action_label || 'Voir',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = notification.data!.action_url;
            }
          },
        } : undefined,
      });
    }
  );
}
