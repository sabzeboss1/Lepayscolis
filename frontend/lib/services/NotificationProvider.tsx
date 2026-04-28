'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { NotificationService } from './NotificationService';
import { usePusher } from '@/lib/websocket/PusherContext';
import { useAuth } from '@/lib/auth';
import type { Notification } from '@/lib/types/api';

interface NotificationContextValue {
  toasts: Toast[];
  notifications: Notification[];
  unreadCount: number;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function NotificationProvider({ children, position = 'top-right' }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { subscribeToPrivateChannel, isConnected } = usePusher();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to NotificationService for toasts
  useEffect(() => {
    const unsubscribe = NotificationService.subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
    });

    return unsubscribe;
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else if (response.status === 401) {
        // Handle unauthorized - user is not authenticated
        console.log('User not authenticated for notifications');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [isAuthenticated]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [isAuthenticated]);

  // Add toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = NotificationService.show(toast);
    return id;
  }, []);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Subscribe to WebSocket notifications
  useEffect(() => {
    if (!isAuthenticated || !user || !isConnected) return;

    const channel = subscribeToPrivateChannel(`user.${user.id}`);
    if (!channel) return;

    // Listen for notification.created event
    channel.bind('notification.created', (data: Notification) => {
      console.log('Received notification via WebSocket:', data);

      // Add to notifications list
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      NotificationService.show({
        type: 'info',
        title: data.title,
        message: data.message,
        duration: 5000,
      });

      // Play sound for high-priority notifications
      if (data.type === 'urgent' || data.type === 'payment') {
        playNotificationSound();
      }
    });

    return () => {
      channel.unbind('notification.created');
    };
  }, [isAuthenticated, user, isConnected, subscribeToPrivateChannel]);

  // Fetch notifications on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const value: NotificationContextValue = {
    toasts,
    notifications,
    unreadCount,
    addToast,
    removeToast,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={handleDismiss} position={position} />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper function to play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.warn('Failed to play notification sound:', error);
    });
  } catch (error) {
    console.warn('Notification sound not available:', error);
  }
}
