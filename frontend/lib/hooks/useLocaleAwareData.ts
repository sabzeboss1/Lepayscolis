/**
 * Hook for managing locale-aware data that reloads when language changes
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocale } from '../i18n/LocaleContext';

/**
 * Hook that automatically reloads data when locale changes
 * @param fetchData - Function to fetch data
 * @param dependencies - Additional dependencies to trigger reload
 */
export function useLocaleAwareData<T>(
  fetchData: () => Promise<T> | void,
  dependencies: any[] = []
) {
  const { locale, onLocaleChange } = useLocale();
  const isMountedRef = useRef(true);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [locale, ...dependencies]);

  // Subscribe to locale changes
  useEffect(() => {
    const unsubscribe = onLocaleChange((newLocale) => {
      if (isMountedRef.current) {
        fetchData();
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [onLocaleChange, fetchData]);

  return { locale };
}

/**
 * Hook that provides locale-aware formatting functions
 */
export function useLocaleFormatting() {
  const { locale } = useLocale();

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      };
      return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number, currency: string = 'XAF') => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale]
  );

  const formatRelativeTime = useCallback(
    (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
      } else if (diffInSeconds < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
      } else if (diffInSeconds < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
      } else if (diffInSeconds < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
      } else if (diffInSeconds < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
      } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
      }
    },
    [locale]
  );

  return {
    locale,
    formatDate,
    formatCurrency,
    formatNumber,
    formatRelativeTime,
  };
}
