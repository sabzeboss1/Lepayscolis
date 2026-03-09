'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface KYCPromptProps {
  action: string; // e.g., "publish a trip", "create a shipment"
  onClose?: () => void;
}

export function KYCPrompt({ action, onClose }: KYCPromptProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleGoToKYC = () => {
    router.push('/kyc');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('kyc.required')}</h2>
            <p className="text-gray-600">
              {t('kyc.requiredMessage', { action })}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleGoToKYC}
            >
              Complete KYC Verification
            </Button>
            {onClose && (
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Why KYC?</strong> Identity verification helps us maintain a safe and trusted community for all users.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
