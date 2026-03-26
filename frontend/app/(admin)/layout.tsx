'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AdminCurrencyProvider } from '@/lib/hooks/useAdminCurrency';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAdmin, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Redirect unauthenticated or non-admin users
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/admin/dashboard');
    } else if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  // Show loading while verifying authentication or redirecting
  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.layout.verifyingAccess')}</p>
        </div>
      </div>
    );
  }

  // Admin layout with sidebar and header
  return (
    <ErrorBoundary>
      <AdminCurrencyProvider>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar userRole={user.role as 'admin' | 'super_admin'} />
          <div className="lg:pl-64">
            <AdminHeader
              userName={user.name}
              userRole={user.role as 'admin' | 'super_admin'}
              onLogout={handleLogout}
            />
            <main className="py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </AdminCurrencyProvider>
    </ErrorBoundary>
  );
}
