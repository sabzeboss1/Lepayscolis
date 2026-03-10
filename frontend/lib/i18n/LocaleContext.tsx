'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale } from './config';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onLocaleChange: (callback: (locale: Locale) => void) => () => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'lepaysexpresscolis-locale';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);
  const [listeners, setListeners] = useState<Set<(locale: Locale) => void>>(new Set());

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (storedLocale && (storedLocale === 'fr' || storedLocale === 'en')) {
        setLocaleState(storedLocale);
      }
      setIsInitialized(true);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    const previousLocale = locale;
    setLocaleState(newLocale);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }

    // Notify all listeners of locale change
    if (previousLocale !== newLocale) {
      listeners.forEach(callback => callback(newLocale));
    }
  };

  const onLocaleChange = (callback: (locale: Locale) => void) => {
    setListeners(prev => new Set(prev).add(callback));
    
    // Return cleanup function
    return () => {
      setListeners(prev => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  };

  // Don't render children until locale is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, onLocaleChange }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
