'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';

interface PlatformBranding {
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  platform_name: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  whatsapp_number: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
}

const defaults: PlatformBranding = {
  logo_url: '/logo.png',
  favicon_url: '/favicon.ico',
  primary_color: '#3B82F6',
  secondary_color: '#F97316',
  platform_name: 'LePaysExpressColis',
  contact_email: 'contact@tumaplus.com',
  contact_phone: '+33 1 23 45 67 89',
  contact_address: 'Paris, France',
  whatsapp_number: '33123456789',
  facebook_url: '#',
  twitter_url: '#',
  instagram_url: '#',
  linkedin_url: '#',
};

const PlatformBrandingContext = createContext<PlatformBranding>(defaults);

export function PlatformBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<PlatformBranding>(defaults);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const apiUrl = apiClient.baseUrl;
        const res = await fetch(`${apiUrl}/api/platform/branding`);
        if (res.ok) {
          const result = await res.json();
          setBranding((prev) => ({ ...prev, ...result.data }));
        }
      } catch {
        // Keep defaults
      }
    };

    fetchBranding();

    const handleUpdate = () => fetchBranding();
    window.addEventListener('platform_branding_updated', handleUpdate);
    return () => window.removeEventListener('platform_branding_updated', handleUpdate);
  }, []);

  // Update document title dynamically with platform_name
  useEffect(() => {
    if (!branding.platform_name || typeof document === 'undefined') return;

    const currentTitle = document.title;
    if (!currentTitle) {
      document.title = `${branding.platform_name} - Transport de Colis Russie ↔ Afrique`;
    } else if (
      currentTitle.includes('LePaysExpressColis') ||
      currentTitle.includes('TumaPlus') ||
      currentTitle.includes('Tuma Plus')
    ) {
      document.title = currentTitle.replace(
        /LePaysExpressColis|TumaPlus|Tuma Plus/g,
        branding.platform_name
      );
    }
  }, [branding.platform_name]);

  // Update favicon and apple-touch-icon dynamically
  useEffect(() => {
    if (!branding.favicon_url) return;

    const setLink = (rel: string, href: string, sizes?: string) => {
      let selector = `link[rel="${rel}"]`;
      if (sizes) selector += `[sizes="${sizes}"]`;
      let link = document.querySelector<HTMLLinkElement>(selector);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (sizes) link.setAttribute('sizes', sizes);
        document.head.appendChild(link);
      }
      link.href = href;
    };

    setLink('icon', branding.favicon_url);
    // Use logo as apple-touch-icon (higher res)
    const touchIcon = branding.logo_url || branding.favicon_url;
    setLink('apple-touch-icon', touchIcon, '180x180');
    setLink('icon', touchIcon, '192x192');

    // Update theme-color meta
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta && branding.primary_color) {
      meta.content = branding.primary_color;
    }
  }, [branding.favicon_url, branding.logo_url, branding.primary_color]);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <PlatformBrandingContext.Provider value={branding}>
      {children}
    </PlatformBrandingContext.Provider>
  );
}

export function usePlatformBranding() {
  return useContext(PlatformBrandingContext);
}