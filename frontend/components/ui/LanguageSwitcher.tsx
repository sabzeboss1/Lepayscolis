'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Locale, locales, localeNames } from '@/lib/i18n/config';
import { ChevronDown } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale !== currentLocale) {
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
      }
      onLocaleChange(newLocale);
    }
    setIsOpen(false);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-20 h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getCurrentFlag = () => {
    return currentLocale === 'fr' ? '🇫🇷' : '🇬🇧';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
        type="button"
      >
        <span role="img" aria-hidden="true" className="text-lg">
          {getCurrentFlag()}
        </span>
        <span className="hidden sm:inline">{currentLocale.toUpperCase()}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {locales.map((locale) => {
              const flag = locale === 'fr' ? '🇫🇷' : '🇬🇧';
              const isActive = locale === currentLocale;

              return (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  role="menuitem"
                >
                  <span role="img" aria-hidden="true" className="text-lg">
                    {flag}
                  </span>
                  <span>{locale.toUpperCase()}</span>
                  {isActive && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
