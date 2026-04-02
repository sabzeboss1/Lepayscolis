'use client';

import type { Metadata } from "next";
import { HeaderApp } from '@/components/layout/HeaderApp';
import { Footer } from '@/components/layout/Footer';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { RealtimeIntegration } from '@/lib/websocket/RealtimeIntegration';
import { useAuth } from '@/lib/auth';
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, logout } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const { locale } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      <SkipToContent />
      <RealtimeIntegration />
      <HeaderApp user={user} locale={locale} unreadMessages={unreadCount} onLogout={handleLogout} />
      <main id="main-content" tabIndex={-1} className="focus:outline-none pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">
        {children}
      </main>
      <Footer locale={locale} />
    </>
  );
}
