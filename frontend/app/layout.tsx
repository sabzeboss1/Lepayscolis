import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from '@/lib/i18n/LocaleContext';
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function generateMetadata(): Promise<Metadata> {
  let platformName = 'TumaPlus';
  let faviconUrl: string | undefined;
  let logoUrl: string | undefined;

  try {
    const res = await fetch(`${BACKEND_URL}/api/platform/branding`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || {};
      platformName = data.platform_name || platformName;
      faviconUrl = data.favicon_url || undefined;
      logoUrl = data.logo_url || undefined;
    }
  } catch {
    // Use defaults
  }

  const iconUrl = faviconUrl || logoUrl;

  return {
    title: {
      default: `${platformName} - Transport de Colis Russie ↔ Afrique`,
      template: `%s | ${platformName}`,
    },
    description: "Envoyez vos colis entre la Russie et l'Afrique avec des voyageurs de confiance",
    icons: iconUrl
      ? {
          icon: iconUrl,
          shortcut: iconUrl,
          apple: logoUrl || iconUrl,
        }
      : undefined,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: platformName,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563EB" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* LocaleProvider au niveau root pour toutes les pages (publiques + privées) */}
        <LocaleProvider>
          <Providers>
            {children}
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
