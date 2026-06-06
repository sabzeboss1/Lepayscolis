'use client';

import { AuthProvider } from '@/lib/auth';
import { LocaleProvider, useLocale } from '@/lib/i18n/LocaleContext';
import { NotificationProvider } from '@/lib/services/NotificationProvider';
import { PlatformBrandingProvider } from '@/lib/hooks/usePlatformBranding';
import { GoogleTranslateLoader } from '@/components/ui/GoogleTranslateWidget';
import { Locale } from '@/lib/i18n/config';
import { useCallback } from 'react';

function AuthWithLocaleSync({ children }: { children: React.ReactNode }) {
  const { setLocale } = useLocale();

  const handleUserLoaded = useCallback((userLocale: Locale) => {
    setLocale(userLocale);
  }, [setLocale]);

  return (
    <AuthProvider onUserLoaded={handleUserLoaded}>
      {children}
    </AuthProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <PlatformBrandingProvider>
        <AuthWithLocaleSync>
          <NotificationProvider>
            <GoogleTranslateLoader />
            {children}
          </NotificationProvider>
        </AuthWithLocaleSync>
      </PlatformBrandingProvider>
    </LocaleProvider>
  );
}
