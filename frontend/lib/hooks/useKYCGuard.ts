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

    if (user.kycStatus !== 'approved') {
      if (showPrompt) {
        router.push('/kyc');
      }
      return false;
    }

    action();
    return true;
  }, [user, router]);

  const isKYCApproved = user?.kycStatus === 'approved';
  const isKYCPending = user?.kycStatus === 'pending';
  const isKYCRejected = user?.kycStatus === 'rejected';
  const needsKYC = !user || user.kycStatus !== 'approved';

  return {
    requireKYC,
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    needsKYC,
    kycStatus: user?.kycStatus || 'not_submitted'
  };
}
