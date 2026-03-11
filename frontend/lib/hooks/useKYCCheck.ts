import { useAuth } from '@/lib/auth';

export function useKYCCheck() {
  const { user } = useAuth();

  const isKYCApproved = user?.kyc_status === 'approved';
  const isKYCPending = user?.kyc_status === 'pending';
  const isKYCRejected = user?.kyc_status === 'rejected';
  const needsKYC = !isKYCApproved;

  return {
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    needsKYC,
    kyc_status: user?.kyc_status,
  };
}
