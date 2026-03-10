'use client';

import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications';
import { useAuth } from '@/lib/auth';

/**
 * Component to integrate real-time features
 * Add this to your app layout to enable real-time notifications
 */
export function RealtimeIntegration() {
  const { isAuthenticated } = useAuth();

  // Enable real-time notifications for authenticated users
  useRealtimeNotifications();

  // This component doesn't render anything
  return null;
}
