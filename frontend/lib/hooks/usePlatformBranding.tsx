'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PlatformBranding {
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  platform_name: string;
}

const defaults: PlatformBranding = {
  logo_url: '/logo.png',
  favicon_url: '/favicon.ico',
  primary_color: '#3B82F6',
  secondary_color: '#F97316',
  platform_name: 'LePaysExpressColis',
};

const PlatformBrandingContext = createContext<PlatformBranding>(defaults);

export function PlatformBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<PlatformBranding>(defaults);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
  }, []);

  // Update favicon dynamically
  useEffect(() => {
    if (branding.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.favicon_url;
    }
  }, [branding.favicon_url]);

  return (
    <PlatformBrandingContext.Provider value={branding}>
      {children}
    </PlatformBrandingContext.Provider>
  );
}

export function usePlatformBranding() {
  return useContext(PlatformBrandingContext);
}
