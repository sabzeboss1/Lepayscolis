'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Payment Cancel Page
 * 
 * This page is displayed when user cancels the Stripe payment.
 * Stripe redirects here when user clicks "Back" or closes the checkout.
 * 
 * Flow:
 * 1. Display cancellation message
 * 2. Provide options to retry payment or return to shipment
 */
export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  const shipmentId = searchParams.get('shipment_id');

  const handleRetryPayment = () => {
    if (shipmentId) {
      router.push(`/payments/checkout?shipment_id=${shipmentId}`);
    } else {
      router.push('/shipments/my');
    }
  };

  const handleViewShipment = () => {
    if (shipmentId) {
      router.push(`/shipments/${shipmentId}`);
    } else {
      router.push('/shipments/my');
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
          <XCircle className="w-8 h-8 text-orange-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {t('payment.cancel.title')}
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          {t('payment.cancel.message')}
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            {t('payment.cancel.info')}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('payment.cancel.retryPayment')}
          </button>
          
          {shipmentId && (
            <button
              onClick={handleViewShipment}
              className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t('payment.cancel.viewShipment')}
            </button>
          )}
          
          <button
            onClick={handleBackToDashboard}
            className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t('common.backToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
}
