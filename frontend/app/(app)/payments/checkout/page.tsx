'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Stripe Checkout Redirect Page
 * 
 * This page handles the redirect to Stripe checkout after a shipment is accepted.
 * Flow:
 * 1. Get shipment_id from URL params
 * 2. Call POST /api/payments/create-checkout with shipment_id
 * 3. Redirect user to Stripe checkout_url
 * 4. Handle errors gracefully
 */
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const shipmentId = searchParams.get('shipment_id');

  useEffect(() => {
    if (!shipmentId) {
      setError(t('payment.errors.missingShipmentId'));
      setIsLoading(false);
      return;
    }

    createCheckoutSession();
  }, [shipmentId]);

  const createCheckoutSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call backend to create Stripe checkout session
      const response = await apiClient.post<{
        checkout_url: string;
        session_id: string;
      }>(API_ENDPOINTS.payments.createCheckout, {
        shipment_id: shipmentId,
      });

      // Redirect to Stripe checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err: any) {
      console.error('Checkout creation error:', err);
      
      // Handle specific error cases
      if (err.status === 404) {
        setError(t('payment.errors.shipmentNotFound'));
      } else if (err.status === 422) {
        setError(err.message || t('payment.errors.invalidShipment'));
      } else if (err.status === 403) {
        setError(t('payment.errors.unauthorized'));
      } else {
        setError(t('payment.errors.checkoutFailed'));
      }
      
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    createCheckoutSession();
  };

  const handleCancel = () => {
    if (shipmentId) {
      router.push(`/shipments/${shipmentId}`);
    } else {
      router.push('/shipments/my');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('payment.checkout.redirecting')}
            </h2>
            <p className="text-gray-600">
              {t('payment.checkout.pleaseWait')}
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {t('payment.checkout.error')}
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              {error}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('common.retry')}
              </button>
              
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
