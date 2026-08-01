'use client';

import { AuthProvider } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { NotificationProvider } from '@/lib/services/NotificationProvider';
import { PlatformBrandingProvider } from '@/lib/hooks/usePlatformBranding';
import { Locale, LOCALE_STORAGE_KEY } from '@/lib/i18n/config';
import { useCallback } from 'react';

function AuthWithLocaleSync({ children }: { children: React.ReactNode }) {
  const { setLocale } = useLocale();

  const handleUserLoaded = useCallback((userLocale: Locale) => {
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (!storedLocale && userLocale) {
        setLocale(userLocale);
      }
    }
  }, [setLocale]);

  return (
    <AuthProvider onUserLoaded={handleUserLoaded}>
      {children}
    </AuthProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlatformBrandingProvider>
      <AuthWithLocaleSync>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthWithLocaleSync>
    </PlatformBrandingProvider>
  );
}
