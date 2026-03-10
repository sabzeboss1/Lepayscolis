'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  expires_at: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  
  const [adminUser, setAdminUser] = useState<{
    name: string;
    role: 'admin' | 'super_admin';
    sessionExpiresAt: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Skip auth check on login page
    if (isLoginPage) {
      setIsVerifying(false);
      return;
    }

    // Verify admin authentication for protected pages
    const verifyAdminAuth = () => {
      console.log('🔍 [AdminLayout] Verifying admin auth for:', pathname);

      if (typeof window === 'undefined') {
        return;
      }

      try {
        const storedUser = localStorage.getItem('admin_user');
        const storedToken = localStorage.getItem('admin_token');

        console.log('🔍 [AdminLayout] Token:', storedToken ? 'Present' : 'Missing');
        console.log('🔍 [AdminLayout] User:', storedUser ? 'Present' : 'Missing');

        // No credentials - redirect to login
        if (!storedUser || !storedToken) {
          console.log('❌ [AdminLayout] No credentials, redirecting to login');
          setIsVerifying(false);
          router.replace('/admin/login');
          return;
        }

        const user: AdminUser = JSON.parse(storedUser);

        // Check admin role
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          console.error('❌ [AdminLayout] Invalid role:', user.role);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setIsVerifying(false);
          router.replace('/dashboard');
          return;
        }

        // Check session expiry
        if (user.expires_at && new Date(user.expires_at) < new Date()) {
          console.log('❌ [AdminLayout] Session expired');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setIsVerifying(false);
          router.replace('/admin/login');
          return;
        }

        console.log('✅ [AdminLayout] Auth valid, role:', user.role);

        // Set admin user state
        setAdminUser({
          name: user.name,
          role: user.role,
          sessionExpiresAt: user.expires_at
        });
        setIsVerifying(false);
      } catch (error) {
        console.error('❌ [AdminLayout] Auth error:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setIsVerifying(false);
        router.replace('/admin/login');
      }
    };

    verifyAdminAuth();
  }, [isLoginPage, router, pathname]);

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await apiClient.post('/api/admin/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage regardless of API call result
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
      // Redirect to login
      router.push('/admin/login');
    }
  };

  // If it's the login page, render without layout
  if (isLoginPage) {
    return (
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    );
  }

  // Show loading while verifying authentication
  if (isVerifying || !adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Regular admin layout with sidebar and header
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar userRole={adminUser.role} />
        <div className="lg:pl-64">
          <AdminHeader 
            userName={adminUser.name}
            userRole={adminUser.role}
            sessionExpiresAt={adminUser.sessionExpiresAt}
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
