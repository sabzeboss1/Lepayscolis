import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook to guard actions that require KYC verification
 * Returns a function that checks KYC status before allowing an action
 */
export function useKYCGuard() {
  const { user } = useAuth();
  const router = useRouter();

  const requireKYC = useCallback((action: () => void, showPrompt: boolean = true) => {
    if (!user) {
      router.push('/auth/login');
      return false;
    }

    // Admins bypass KYC verification
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isAdmin && user.kyc_status !== 'approved') {
      if (showPrompt) {
        router.push('/kyc');
      }
      return false;
    }

    action();
    return true;
  }, [user, router]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isKYCApproved = user?.kyc_status === 'approved';
  const isKYCPending = user?.kyc_status === 'pending';
  const isKYCRejected = user?.kyc_status === 'rejected';
  const isKYCNotSubmitted = user?.kyc_status === 'not_submitted';
  const needsKYC = !isAdmin && (!user || user.kyc_status !== 'approved');

  return {
    requireKYC,
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    isKYCNotSubmitted,
    needsKYC,
    kyc_status: user?.kyc_status || 'not_submitted'
  };
}
