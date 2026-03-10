'use client';

import { useCallback } from 'react';
import { Locale } from './config';
import { useLocale } from './LocaleContext';
import frTranslations from './translations/fr.json';
import enTranslations from './translations/en.json';

const translations: Record<Locale, typeof frTranslations> = {
  fr: frTranslations,
  en: enTranslations,
};

/**
 * Hook for accessing translations with parameter interpolation
 * Can be used with or without LocaleContext
 * @param localeOverride - Optional locale to override context locale (useful for testing)
 */
export function useTranslation(localeOverride?: Locale) {
  // Try to get locale from context, fall back to override or default
  let contextLocale: Locale | undefined;
  try {
    const localeContext = useLocale();
    contextLocale = localeContext.locale;
  } catch {
    // Not within LocaleProvider, use override or default
    contextLocale = undefined;
  }

  const locale = localeOverride || contextLocale || 'fr';

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const keys = key.split('.');
      let value: any = translations[locale];

      for (const k of keys) {
        value = value?.[k];
        if (!value) return key; // fallback to key if not found
      }

      // Replace params like {{name}}
      if (params && typeof value === 'string') {
        return Object.entries(params).reduce(
          (str, [key, val]) => str.replace(`{{${key}}}`, String(val)),
          value
        );
      }

      return value;
    },
    [locale]
  );

  return { t, locale };
}
