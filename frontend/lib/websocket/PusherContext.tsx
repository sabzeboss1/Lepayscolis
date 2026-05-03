'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Pusher, { Channel, PresenceChannel } from 'pusher-js';
import { useAuth } from '@/lib/auth';

interface PusherContextValue {
  pusher: Pusher | null;
  isConnected: boolean;
  subscribe: (channelName: string) => Channel | null;
  unsubscribe: (channelName: string) => void;
  subscribeToPrivateChannel: (channelName: string) => Channel | null;
  subscribeToPresenceChannel: (channelName: string) => PresenceChannel | null;
}

const PusherContext = createContext<PusherContextValue | undefined>(undefined);

interface PusherProviderProps {
  children: React.ReactNode;
}

export function PusherProvider({ children }: PusherProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<Map<string, Channel>>(new Map());

  // Initialize Pusher connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if user logs out
      if (pusher) {
        pusher.disconnect();
        setPusher(null);
        setIsConnected(false);
        channelsRef.current.clear();
      }
      return;
    }

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';
    const pusherHost = process.env.NEXT_PUBLIC_PUSHER_HOST;
    const pusherPort = parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || '443');
    const pusherScheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME || 'https';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    if (!pusherKey) {
      console.warn('Pusher key not configured');
      return;
    }

    // Get auth token from cookie
    const getAuthToken = () => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split('; ');
      const authCookie = cookies.find(row => row.startsWith('auth-token='));
      return authCookie ? authCookie.split('=')[1] : null;
    };

    // Get CSRF token from cookie
    const getCsrfToken = () => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split('; ');
      const csrfCookie = cookies.find(row => row.startsWith('XSRF-TOKEN='));
      return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null;
    };

    // Create Pusher instance with custom host configuration
    const pusherConfig: any = {
      authEndpoint: `${apiUrl}/api/broadcasting/auth`,
      auth: {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'X-XSRF-TOKEN': getCsrfToken() || '',
        },
      },
    };

    // If custom host is provided, use it (Soketi)
    if (pusherHost) {
      pusherConfig.wsHost = pusherHost;
      pusherConfig.wsPort = pusherPort;
      pusherConfig.wssPort = pusherPort;
      pusherConfig.forceTLS = pusherScheme === 'https';
      pusherConfig.enabledTransports = ['ws', 'wss'];
      pusherConfig.disableStats = true;
      console.log('Using custom Pusher host (Soketi):', pusherHost);
    } else {
      // Use default Pusher configuration
      pusherConfig.cluster = pusherCluster;
      pusherConfig.forceTLS = true;
      console.log('Using default Pusher cluster:', pusherCluster);
    }

    // Create Pusher instance
    const pusherInstance = new Pusher(pusherKey, pusherConfig);

    // Connection state handlers
    pusherInstance.connection.bind('connected', () => {
      console.log('Pusher connected');
      setIsConnected(true);
    });

    pusherInstance.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
      setIsConnected(false);
    });

    pusherInstance.connection.bind('error', (err: any) => {
      console.error('Pusher connection error:', err);
      setIsConnected(false);
    });

    setPusher(pusherInstance);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up Pusher connection');
      channelsRef.current.forEach((channel, channelName) => {
        pusherInstance.unsubscribe(channelName);
      });
      channelsRef.current.clear();
      pusherInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  // Subscribe to a public channel
  const subscribe = useCallback(
    (channelName: string): Channel | null => {
      if (!pusher) {
        console.warn('Pusher not initialized');
        return null;
      }

      // Check if already subscribed
      if (channelsRef.current.has(channelName)) {
        return channelsRef.current.get(channelName)!;
      }

      const channel = pusher.subscribe(channelName);
      channelsRef.current.set(channelName, channel);
      
      console.log(`Subscribed to channel: ${channelName}`);
      return channel;
    },
    [pusher]
  );

  // Subscribe to a private channel
  const subscribeToPrivateChannel = useCallback(
    (channelName: string): Channel | null => {
      if (!pusher) {
        console.warn('Pusher not initialized');
        return null;
      }

      // Ensure channel name starts with 'private-'
      const privateChannelName = channelName.startsWith('private-')
        ? channelName
        : `private-${channelName}`;

      // Check if already subscribed
      if (channelsRef.current.has(privateChannelName)) {
        return channelsRef.current.get(privateChannelName)!;
      }

      const channel = pusher.subscribe(privateChannelName);
      channelsRef.current.set(privateChannelName, channel);
      
      console.log(`Subscribed to private channel: ${privateChannelName}`);
      return channel;
    },
    [pusher]
  );

  // Subscribe to a presence channel
  const subscribeToPresenceChannel = useCallback(
    (channelName: string): PresenceChannel | null => {
      if (!pusher) {
        console.warn('Pusher not initialized');
        return null;
      }

      // Ensure channel name starts with 'presence-'
      const presenceChannelName = channelName.startsWith('presence-')
        ? channelName
        : `presence-${channelName}`;

      // Check if already subscribed
      if (channelsRef.current.has(presenceChannelName)) {
        return channelsRef.current.get(presenceChannelName) as PresenceChannel;
      }

      const channel = pusher.subscribe(presenceChannelName) as PresenceChannel;
      channelsRef.current.set(presenceChannelName, channel);
      
      console.log(`Subscribed to presence channel: ${presenceChannelName}`);
      return channel;
    },
    [pusher]
  );

  // Unsubscribe from a channel
  const unsubscribe = useCallback(
    (channelName: string): void => {
      if (!pusher) {
        return;
      }

      pusher.unsubscribe(channelName);
      channelsRef.current.delete(channelName);
      
      console.log(`Unsubscribed from channel: ${channelName}`);
    },
    [pusher]
  );

  const value: PusherContextValue = {
    pusher,
    isConnected,
    subscribe,
    unsubscribe,
    subscribeToPrivateChannel,
    subscribeToPresenceChannel,
  };

  return (
    <PusherContext.Provider value={value}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher(): PusherContextValue {
  const context = useContext(PusherContext);
  if (context === undefined) {
    throw new Error('usePusher must be used within a PusherProvider');
  }
  return context;
}
