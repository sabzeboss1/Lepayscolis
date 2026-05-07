import type { MetadataRoute } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let platformName = 'TumaPlus';
  let logoUrl = '/logo.png';
  let primaryColor = '#2563EB';
  let secondaryColor = '#F97316';

  try {
    const res = await fetch(`${BACKEND_URL}/api/platform/branding`, {
      next: { revalidate: 300 }, // Cache 5 min
    });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || {};
      platformName = data.platform_name || platformName;
      logoUrl = data.logo_url || logoUrl;
      primaryColor = data.primary_color || primaryColor;
      secondaryColor = data.secondary_color || secondaryColor;
    }
  } catch {
    // Use defaults
  }

  // Use the absolute backend logo URL directly for PWA icons
  // logoUrl is now an absolute URL from the backend (e.g. https://api.domain.com/storage/branding/logo_xxx.png)
  const iconSrc = logoUrl;

  return {
    name: platformName,
    short_name: platformName,
    description: 'Envoyez vos colis entre la Russie et l\'Afrique avec des voyageurs de confiance',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: primaryColor,
    orientation: 'portrait-primary',
    categories: ['logistics', 'travel', 'shipping'],
    icons: [
      {
        src: iconSrc,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: iconSrc,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: iconSrc,
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide' as const,
        label: platformName,
      } as any,
      {
        src: iconSrc,
        sizes: '512x512',
        type: 'image/png',
        label: platformName,
      } as any,
    ],
  };
}
