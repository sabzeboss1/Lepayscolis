import { useAuth } from '@/lib/auth';

export function useKYCCheck() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isKYCApproved = user?.kyc_status === 'approved';
  const isKYCPending = user?.kyc_status === 'pending';
  const isKYCRejected = user?.kyc_status === 'rejected';
  const isKYCNotSubmitted = user?.kyc_status === 'not_submitted';
  const needsKYC = !isAdmin && !isKYCApproved;

  return {
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    isKYCNotSubmitted,
    needsKYC,
    kyc_status: user?.kyc_status,
  };
}
