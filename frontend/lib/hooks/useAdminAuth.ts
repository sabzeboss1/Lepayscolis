'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Hook to handle admin authentication and redirects
 * Automatically redirects to login if not authenticated or not an admin
 */
export function useAdminAuth() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not authenticated - redirect to login
      router.replace('/auth/login?redirect=/admin/dashboard');
    } else if (!isAdmin) {
      // Authenticated but not admin - redirect to user dashboard
      router.replace('/dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  return {
    user,
    isLoading,
    isAdmin,
    isReady: !isLoading && !!user && isAdmin,
  };
}
