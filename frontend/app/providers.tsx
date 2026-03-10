'use client';

import { AuthProvider } from '@/lib/auth';
import { LocaleProvider } from '@/lib/i18n/LocaleContext';
import { PusherProvider } from '@/lib/websocket/PusherContext';
import { NotificationProvider } from '@/lib/services/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <PusherProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </PusherProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
