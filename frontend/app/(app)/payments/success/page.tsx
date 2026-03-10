'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Payment, ApiResponse, Shipment } from '@/lib/types/api';

/**
 * Payment Success Page
 * 
 * This page is displayed after successful Stripe payment.
 * Stripe redirects here with session_id in URL params.
 * 
 * Flow:
 * 1. Get session_id from URL params
 * 2. Verify payment status via backend API
 * 3. Display success message with payment details
 * 4. Provide link to shipment details
 */
export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get('session_id');
  const shipmentId = searchParams.get('shipment_id');

  useEffect(() => {
    if (!sessionId && !shipmentId) {
      setError(t('payment.errors.missingSessionId'));
      setIsLoading(false);
      return;
    }

    verifyPayment();
  }, [sessionId, shipmentId]);

  const verifyPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait a moment to ensure webhook has been processed by backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch payment details from backend
      // The backend should have already received the webhook from Stripe
      // and created/updated the payment record
      
      if (!shipmentId) {
        throw new Error('Missing shipment ID');
      }
      
      // Fetch shipment details which includes payment information
      const shipmentResponse = await apiClient.get<ApiResponse<Shipment>>(
        API_ENDPOINTS.shipments.show(shipmentId)
      );
      
      // In a real implementation, we would have a dedicated endpoint to get payment by shipment_id
      // For now, we'll construct payment data from shipment information
      // TODO: Add GET /api/payments?shipment_id={id} endpoint to backend
      
      const fetchedPayment: Payment = {
        id: sessionId || `payment_${shipmentId}`,
        shipment_id: shipmentId,
        shipment: shipmentResponse.data,
        payer_id: shipmentResponse.data.sender_id,
        payer: shipmentResponse.data.sender,
        payee_id: shipmentResponse.data.traveler_id,
        payee: shipmentResponse.data.traveler,
        amount: shipmentResponse.data.price,
        currency: 'EUR',
        status: 'held', // Payment is held in escrow after successful checkout
        stripe_payment_intent_id: sessionId || '',
        created_at: shipmentResponse.data.created_at,
        updated_at: shipmentResponse.data.updated_at,
      };
      
      setPayment(fetchedPayment);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setError(t('payment.errors.verificationFailed'));
      setIsLoading(false);
    }
  };

  const handleViewShipment = () => {
    if (shipmentId) {
      router.push(`/shipments/${shipmentId}`);
    } else if (payment?.shipment_id) {
      router.push(`/shipments/${payment.shipment_id}`);
    } else {
      router.push('/shipments/my');
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('payment.success.verifying')}
          </h2>
          <p className="text-gray-600">
            {t('payment.success.pleaseWait')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            {t('payment.success.errorTitle')}
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            {error}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={verifyPayment}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('common.retry')}
            </button>
            
            <button
              onClick={handleBackToDashboard}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t('common.backToDashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {t('payment.success.title')}
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          {t('payment.success.message')}
        </p>
        
        {payment && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('payment.success.status')}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {t(`payment.status.${payment.status}`)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('payment.success.amount')}</span>
              <span className="text-sm font-semibold text-gray-900">
                {payment.amount.toFixed(2)} {payment.currency}
              </span>
            </div>
            
            {payment.stripe_payment_intent_id && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('payment.success.transactionId')}</span>
                <span className="text-xs font-mono text-gray-500">
                  {payment.stripe_payment_intent_id.substring(0, 20)}...
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            {t('payment.success.escrowInfo')}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleViewShipment}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('payment.success.viewShipment')}
          </button>
          
          <button
            onClick={handleBackToDashboard}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {t('common.backToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
}
