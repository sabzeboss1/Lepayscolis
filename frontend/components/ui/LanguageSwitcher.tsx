'use client';

import React, { useEffect, useState } from 'react';
import { Locale, locales, localeNames } from '@/lib/i18n/config';

export interface LanguageSwitcherProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLocale,
  onLocaleChange,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale !== currentLocale) {
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
      }
      onLocaleChange(newLocale);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-20 h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 bg-gray-100 rounded-lg p-1 ${className}`}
      role="group"
      aria-label="Language selector"
    >
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        const flag = locale === 'fr' ? '🇫🇷' : '🇬🇧';

        return (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
              transition-colors min-h-[44px] min-w-[44px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
            aria-label={`Switch to ${localeNames[locale]}`}
            aria-pressed={isActive}
            type="button"
          >
            <span role="img" aria-hidden="true" className="text-lg">
              {flag}
            </span>
            <span className="hidden sm:inline">{locale.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
};
