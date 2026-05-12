'use client';

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { NotificationService } from './NotificationService';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const prevCountRef = useRef(0);

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
      const response = await apiClient.get<{
        notifications: Notification[];
        unread_count: number;
        pagination: { current_page: number; last_page: number; per_page: number; total: number };
      }>(API_ENDPOINTS.notifications.list);

      const newNotifications = response.notifications || [];
      const newUnreadCount = response.unread_count || 0;

      // Check if there are new notifications since last fetch
      if (prevCountRef.current > 0 && newNotifications.length > prevCountRef.current) {
        const latestNotification = newNotifications[0];
        NotificationService.show({
          type: 'info',
          title: latestNotification.title,
          message: latestNotification.message || (latestNotification as any).body,
          duration: 5000,
        });
      }
      prevCountRef.current = newNotifications.length;

      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
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
      await apiClient.put(API_ENDPOINTS.notifications.markRead(id));

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [isAuthenticated]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await apiClient.put(API_ENDPOINTS.notifications.markAllRead);

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
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

  // Poll for notifications every 15 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
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
