'use client';

import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Show loading while verifying authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!user) {
    router.replace('/auth/login?redirect=/admin/dashboard');
    return null;
  }

  // Authenticated but not admin — redirect to user dashboard
  if (!isAdmin) {
    router.replace('/dashboard');
    return null;
  }

  // Admin layout with sidebar and header
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
