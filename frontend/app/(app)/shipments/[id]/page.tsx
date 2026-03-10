'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserCard } from '@/components/ui/UserCard';
import { Timeline } from '@/components/ui/Timeline';
import { RatingModal } from '@/components/features/RatingModal';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { useRealtimeShipmentStatus, useRealtimePaymentStatus } from '@/lib/hooks/useRealtimeStatusUpdates';
import { Shipment, ApiResponse, Payment } from '@/lib/types/api';

export default function ShipmentDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchShipmentDetails(params.id as string);
    }
  }, [params.id]);

  // Real-time status updates via WebSocket
  useRealtimeShipmentStatus(
    shipment?.id || null,
    (data) => {
      if (shipment) {
        setShipment({ ...shipment, status: data.status as any });
      }
    }
  );

  // Real-time payment status updates via WebSocket
  useRealtimePaymentStatus((data) => {
    // Update payment status when received via WebSocket
    if (payment && data.id === payment.id) {
      setPayment({ ...payment, status: data.status as any });
    }
  });

  const fetchShipmentDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiResponse<Shipment>>(API_ENDPOINTS.shipments.show(id));
      setShipment(response.data);
      
      // Fetch payment information if shipment has been accepted
      if (response.data.status !== 'pending' && response.data.status !== 'cancelled') {
        fetchPaymentDetails(id);
      }
    } catch (err) {
      console.error('Failed to fetch shipment:', err);
      setError(ErrorHandler.handle(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentDetails = async (shipmentId: string) => {
    try {
      // In a real implementation, we would have an endpoint to get payment by shipment_id
      // For now, we'll use a mock payment based on shipment status
      // TODO: Replace with actual API call when backend endpoint is available
      const mockPayment: Payment = {
        id: `payment_${shipmentId}`,
        shipment_id: shipmentId,
        shipment: {} as any,
        payer_id: shipment?.sender_id || '',
        payer: {} as any,
        payee_id: shipment?.traveler_id,
        payee: shipment?.traveler,
        amount: shipment?.price || 0,
        currency: 'EUR',
        status: shipment?.status === 'paid' || shipment?.status === 'in_transit' || shipment?.status === 'delivered' 
          ? 'held' 
          : shipment?.status === 'delivered' 
          ? 'released' 
          : 'pending',
        created_at: shipment?.created_at || new Date().toISOString(),
        updated_at: shipment?.updated_at || new Date().toISOString(),
      };
      setPayment(mockPayment);
    } catch (err) {
      console.error('Failed to fetch payment:', err);
      // Don't show error for payment fetch failure, just log it
    }
  };

  const handleContactUser = (userId: string) => {
    router.push(`/messages?userId=${userId}`);
  };

  const handleConfirmDelivery = async () => {
    if (!shipment || !confirm(t('common.confirm') + '?')) return;

    try {
      await apiClient.post(API_ENDPOINTS.shipments.updateStatus(shipment.id), {
        status: 'delivered',
      });

      // Refresh shipment details
      fetchShipmentDetails(shipment.id);
    } catch (err) {
      console.error('Failed to confirm delivery:', err);
      alert(ErrorHandler.handle(err));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'held':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimelineSteps = () => {
    if (!shipment) return [];

    type StepStatus = 'completed' | 'current' | 'pending';

    const steps = [
      {
        id: 'pending',
        label: t('shipments.pending'),
        status: 'completed' as StepStatus,
        date: shipment.created_at,
      },
      {
        id: 'accepted',
        label: t('shipments.accepted'),
        status: (shipment.status === 'pending' ? 'pending' : 'completed') as StepStatus,
      },
      {
        id: 'paid',
        label: t('shipments.paid'),
        status: (
          shipment.status === 'pending' || shipment.status === 'accepted'
            ? 'pending'
            : 'completed'
        ) as StepStatus,
      },
      {
        id: 'in_transit',
        label: t('shipments.inTransit'),
        status: (
          shipment.status === 'pending' || shipment.status === 'accepted' || shipment.status === 'paid'
            ? 'pending'
            : shipment.status === 'in_transit'
            ? 'current'
            : 'completed'
        ) as StepStatus,
      },
      {
        id: 'delivered',
        label: t('shipments.delivered'),
        status: (
          shipment.status === 'delivered'
            ? 'completed'
            : shipment.status === 'cancelled'
            ? 'pending'
            : 'pending'
        ) as StepStatus,
      },
    ];

    return steps;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error || t('errors.notFound')}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const isSender = user?.id === shipment.sender_id;
  const isTraveler = user?.id === shipment.traveler_id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← {t('common.back')}
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {shipment.pickup_city} → {shipment.delivery_city}
          </h1>
          <div className="flex gap-2">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(
                shipment.status
              )}`}
            >
              {t(`shipments.${shipment.status === 'in_transit' ? 'inTransit' : shipment.status}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Progress Timeline */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">{t('shipments.deliveryProgress')}</h2>
        <Timeline steps={getTimelineSteps()} orientation="horizontal" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('shipments.packageDetails')}</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('shipments.description')}</p>
                <p className="text-gray-900">{shipment.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('shipments.weight')}</p>
                  <p className="text-gray-900">{shipment.weight} kg</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('shipments.packageType')}</p>
                  <p className="text-gray-900">{shipment.package_type}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{t('shipments.value')}</p>
                <p className="text-gray-900">€{shipment.value.toFixed(2)}</p>
              </div>
              {shipment.photo_urls && shipment.photo_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('shipments.photos')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {shipment.photo_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Package photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Location Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('shipments.locationDetails')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{t('shipments.pickup')}</h3>
                <p className="text-gray-700">{shipment.pickup_city}, {shipment.pickup_country}</p>
                <p className="text-sm text-gray-600 mt-1">{shipment.pickup_address}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{t('shipments.delivery')}</h3>
                <p className="text-gray-700">{shipment.delivery_city}, {shipment.delivery_country}</p>
                <p className="text-sm text-gray-600 mt-1">{shipment.delivery_address}</p>
              </div>
            </div>
          </Card>

          {/* Recipient Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('shipments.recipientInfo')}</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('shipments.recipientName')}</p>
                <p className="text-gray-900">{shipment.recipient_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{t('shipments.recipientPhone')}</p>
                <p className="text-gray-900">{shipment.recipient_phone}</p>
              </div>
            </div>
          </Card>

          {/* Payment Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('shipments.payment')}</h2>
            <div className="space-y-3">
              {payment && (
                <>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <p className="text-sm font-medium text-gray-700">{t('payment.status.label')}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(
                        payment.status
                      )}`}
                    >
                      {t(`payment.status.${payment.status}`)}
                    </span>
                  </div>
                  
                  {payment.status === 'held' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        {isSender 
                          ? t('payment.escrow.senderInfo')
                          : t('payment.escrow.travelerInfo')}
                      </p>
                    </div>
                  )}
                  
                  {payment.status === 'released' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        {t('payment.escrow.released')}
                      </p>
                    </div>
                  )}
                  
                  {payment.status === 'refunded' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-800">
                        {t('payment.escrow.refunded')}
                      </p>
                    </div>
                  )}
                  
                  {payment.stripe_payment_intent_id && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{t('payment.transactionId')}</span>
                      <span className="font-mono">{payment.stripe_payment_intent_id.substring(0, 20)}...</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex items-center justify-between border-t pt-3">
                <p className="text-lg font-semibold text-gray-900">{t('common.total')}</p>
                <p className="text-2xl font-bold text-gray-900">€{shipment.price.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sender Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">{t('profile.personalInfo')}</h3>
            <UserCard
              user={shipment.sender}
              showContactButton={!isSender && shipment.status !== 'cancelled'}
              onClick={() => !isSender && handleContactUser(shipment.sender.id)}
            />
          </Card>

          {/* Traveler Info */}
          {shipment.traveler && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">{t('shipments.matchedTraveler')}</h3>
              <UserCard
                user={shipment.traveler}
                showContactButton={!isTraveler && shipment.status !== 'cancelled'}
                onClick={() => !isTraveler && handleContactUser(shipment.traveler!.id)}
              />
            </Card>
          )}

          {/* Actions */}
          {isSender && shipment.status === 'in_transit' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">{t('common.confirm')} {t('shipments.delivery')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Confirm that you have received your package to release payment to the traveler.
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={handleConfirmDelivery}
              >
                {t('common.confirm')} {t('shipments.delivered')}
              </Button>
            </Card>
          )}

          {/* Rating Action */}
          {shipment.status === 'delivered' && (isSender || isTraveler) && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">{t('ratings.title')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {isSender 
                  ? 'Rate your experience with the traveler'
                  : 'Rate your experience with the sender'}
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setShowRatingModal(true)}
              >
                {t('ratings.submitRating')}
              </Button>
            </Card>
          )}

          {/* Metadata */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(shipment.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="text-gray-900 font-mono text-xs">{shipment.id.slice(0, 8)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && shipment && user && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          shipment={shipment}
          ratedUser={isSender ? shipment.traveler! : shipment.sender}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
