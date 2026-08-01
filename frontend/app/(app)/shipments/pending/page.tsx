'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { RatingStars } from '@/components/ui/RatingStars';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import { apiClient } from '@/lib/api/client';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import {
  Package,
  MapPin,
  Weight,
  Ruler,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface Shipment {
  id: string;
  package_description: string;
  package_weight: number;
  package_length: number;
  package_width: number;
  package_height: number;
  pickup_city: string;
  pickup_country: string;
  delivery_city: string;
  delivery_country: string;
  status: string;
  payment_amount: number;
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    completed_deliveries: number;
  };
  trip?: {
    id: string;
    departure_city: string;
    arrival_city: string;
  };
}

export default function PendingShipmentsPage() {
  const { t, locale } = useTranslation();
  const { formatCurrency } = useUserCurrency();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchPendingShipments();
  }, []);

  const fetchPendingShipments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: Shipment[] }>('/api/shipments/pending-for-me');
      setShipments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch pending shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (shipmentId: string) => {
    // Find the shipment to get its trip_id
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment || !shipment.trip) {
      setModalState({
        isOpen: true,
        title: 'Erreur',
        message: 'Trajet non trouvé. Impossible d\'accepter cette expédition.',
        type: 'error',
      });
      return;
    }

    setModalState({
      isOpen: true,
      title: 'Accepter l\'expédition',
      message: 'Êtes-vous sûr de vouloir accepter cette expédition ? Vous vous engagez à transporter ce colis.',
      type: 'confirm',
      confirmText: 'Accepter',
      onConfirm: async () => {
        setProcessingId(shipmentId);
        try {
          await apiClient.post(`/api/shipments/${shipmentId}/accept`, {
            trip_id: shipment.trip?.id,
          });
          await fetchPendingShipments();
          setModalState({
            isOpen: true,
            title: 'Succès',
            message: 'Expédition acceptée avec succès ! Vous pouvez maintenant gérer cette expédition depuis vos trajets.',
            type: 'success',
          });
        } catch (err) {
          const errorMessage = ErrorHandler.handle(err);
          setModalState({
            isOpen: true,
            title: 'Erreur',
            message: errorMessage.message,
            type: 'error',
          });
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  const handleReject = async (shipmentId: string) => {
    setModalState({
      isOpen: true,
      title: 'Refuser l\'expédition',
      message: 'Êtes-vous sûr de vouloir refuser cette expédition ? Cette action est irréversible.',
      type: 'confirm',
      confirmText: 'Refuser',
      onConfirm: async () => {
        setProcessingId(shipmentId);
        try {
          await apiClient.post(`/api/shipments/${shipmentId}/reject`);
          await fetchPendingShipments();
          setModalState({
            isOpen: true,
            title: 'Expédition refusée',
            message: 'L\'expédition a été refusée. L\'expéditeur en sera informé.',
            type: 'info',
          });
        } catch (err) {
          const errorMessage = ErrorHandler.handle(err);
          setModalState({
            isOpen: true,
            title: 'Erreur',
            message: errorMessage.message,
            type: 'error',
          });
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" style={{ color: 'var(--color-royal-blue)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-muted-text)' }}>
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a8a 50%, #1e40af 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.2)' }}
            >
              <Package className="w-6 h-6" style={{ color: 'var(--color-vibrant-orange)' }} />
            </div>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t('shipments.pendingRequests') || 'Demandes en attente'}
          </h1>
          <p className="text-white/70 mt-2">
            {t('shipments.pendingSubtitle') || 'Gérez les demandes d\'expédition soumises sur vos trajets'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {shipments.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('shipments.noPendingTitle') || 'Aucune demande en attente'}
              </h2>
              <p className="text-gray-600">
                {t('shipments.noPendingDesc') || 'Vous n\'avez pas de demandes d\'expédition en attente pour le moment.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="p-5">
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Left: Shipment Info */}
                  <div className="flex-1 space-y-4">
                    {/* Sender */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)' }}
                      >
                        {shipment.sender.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-navy)' }}>
                          {shipment.sender.name}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <RatingStars rating={shipment.sender.rating || 0} size="sm" />
                          <span className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                            {Number(shipment.sender.rating || 0).toFixed(1)} · {shipment.sender.completed_deliveries || 0} {t('shipments.shipmentsCount') || 'expéditions'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
                        {shipment.package_description}
                      </p>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" style={{ color: 'var(--color-success-green)' }} />
                      <span style={{ color: 'var(--color-body-text)' }}>
                        {shipment.pickup_city}, {shipment.pickup_country}
                      </span>
                      <span style={{ color: 'var(--color-muted-text)' }}>→</span>
                      <MapPin className="w-4 h-4" style={{ color: '#7c3aed' }} />
                      <span style={{ color: 'var(--color-body-text)' }}>
                        {shipment.delivery_city}, {shipment.delivery_country}
                      </span>
                    </div>

                    {/* Package Details */}
                    <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--color-muted-text)' }}>
                      <span className="inline-flex items-center gap-1">
                        <Weight className="w-3 h-3" />
                        {shipment.package_weight} kg
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {shipment.package_length} × {shipment.package_width} × {shipment.package_height} cm
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(shipment.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-between gap-3 lg:w-48">
                    {shipment.payment_amount > 0 && (
                      <div
                        className="px-4 py-3 rounded-xl text-center"
                        style={{
                          background: 'rgba(249,115,22,0.1)',
                          border: '1px solid rgba(249,115,22,0.2)',
                        }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#c2410c' }}>
                          {t('shipments.paymentLabel') || 'Paiement'}
                        </p>
                        <p
                          className="text-2xl font-bold mt-1"
                          style={{ color: 'var(--color-vibrant-orange)', fontFamily: 'var(--font-heading)' }}
                        >
                          {formatCurrency(shipment.payment_amount)}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(shipment.id)}
                        disabled={processingId === shipment.id}
                        loading={processingId === shipment.id}
                        className="w-full"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {t('common.confirm') || 'Accepter'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(shipment.id)}
                        disabled={processingId === shipment.id}
                        className="w-full"
                        style={{ color: '#dc2626', borderColor: '#dc2626' }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        {t('common.cancel') || 'Refuser'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        loading={modalState.loading}
      />
    </div>
  );
}
