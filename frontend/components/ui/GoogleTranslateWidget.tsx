'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            layout?: number;
            autoDisplay?: boolean;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit: () => void;
    _gtScriptLoaded?: boolean;
  }
}

/**
 * Mapping from our app locale codes to Google Translate language codes.
 */
const LOCALE_TO_GOOGLE: Record<string, string> = {
  fr: 'fr',
  en: 'en',
};

/**
 * Programmatically change the Google Translate language.
 * Finds the hidden Google Translate <select> and dispatches a change event.
 */
export function setGoogleTranslateLanguage(locale: string) {
  const googleLang = LOCALE_TO_GOOGLE[locale] || locale;

  // Method 1: Set the hidden <select> and trigger change
  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (select) {
    select.value = googleLang;
    select.dispatchEvent(new Event('change'));
    return;
  }

  // Method 2: Set the cookie so Google picks it up on next page load
  const domain = window.location.hostname;
  document.cookie = `googtrans=/fr/${googleLang};path=/;domain=${domain}`;
  document.cookie = `googtrans=/fr/${googleLang};path=/`;

  // If Google Translate hasn't loaded yet, reload after cookie is set
  window.location.reload();
}

/**
 * Hidden component that loads the Google Translate script in the background.
 * Renders a hidden mount-point div that Google needs to initialise.
 * 
 * Place this once in your app (e.g. in Providers or layout).
 */
export function GoogleTranslateLoader() {
  useEffect(() => {
    if (window._gtScriptLoaded) return;
    window._gtScriptLoaded = true;

    // Google calls this function after the script loads
    window.googleTranslateElementInit = () => {
      const el = document.getElementById('google_translate_element');
      if (el) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'fr',
            includedLanguages: 'fr,en',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    const script = document.createElement('script');
    script.src =
      '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Hidden mount point — required by Google Translate to initialise
  return (
    <div
      id="google_translate_element"
      style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
    />
  );
}
