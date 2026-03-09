import { useAuth } from '@/lib/auth';

export function useKYCCheck() {
  const { user } = useAuth();

  const isKYCApproved = user?.kycStatus === 'approved';
  const isKYCPending = user?.kycStatus === 'pending';
  const isKYCRejected = user?.kycStatus === 'rejected';
  const needsKYC = !isKYCApproved;

  return {
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    needsKYC,
    kycStatus: user?.kycStatus,
  };
}
