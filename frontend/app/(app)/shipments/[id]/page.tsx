'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RatingModal } from '@/components/features/RatingModal';
import { apiClient } from '@/lib/api/client';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import type { Shipment } from '@/lib/types/api';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import {
  Package,
  MapPin,
  Weight,
  Ruler,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  DollarSign,
  Loader2,
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'pending', label: 'En attente', icon: Clock },
  { key: 'accepted', label: 'Accepté', icon: CheckCircle },
  { key: 'in_transit', label: 'En transit', icon: Truck },
  { key: 'delivered', label: 'Livré', icon: Package },
];

export default function ShipmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { formatCurrency } = useUserCurrency();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    userId: number;
    userName: string;
    userRole: 'sender' | 'traveler';
  } | null>(null);
  
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
    fetchShipment();
  }, [params.id]);

  const fetchShipment = async () => {
    try {
      const response = await apiClient.get<{ data: Shipment }>(`/api/shipments/${params.id}`);
      setShipment(response.data);
    } catch (err) {
      console.error('Failed to fetch shipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const statusLabels: Record<string, string> = {
      in_transit: 'En transit',
      delivered: 'Livré',
    };
    
    setModalState({
      isOpen: true,
      title: 'Confirmer le changement de statut',
      message: `Voulez-vous vraiment marquer cette expédition comme "${statusLabels[newStatus] || newStatus}" ?`,
      type: 'confirm',
      onConfirm: async () => {
        setProcessing(true);
        try {
          await apiClient.put(`/api/shipments/${params.id}`, { status: newStatus });
          await fetchShipment();
          setModalState({
            isOpen: true,
            title: 'Succès',
            message: 'Le statut a été mis à jour avec succès',
            type: 'success',
          });
        } catch (err) {
          setModalState({
            isOpen: true,
            title: 'Erreur',
            message: ErrorHandler.handle(err).message,
            type: 'error',
          });
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const handleConfirmDelivery = async () => {
    setModalState({
      isOpen: true,
      title: 'Confirmer la livraison',
      message: 'Confirmez-vous avoir reçu le colis ? Les fonds seront transférés au voyageur.',
      type: 'confirm',
      confirmText: 'Confirmer la livraison',
      onConfirm: async () => {
        setProcessing(true);
        try {
          await apiClient.post(`/api/shipments/${params.id}/confirm-delivery`);
          await fetchShipment();
          setModalState({
            isOpen: true,
            title: 'Livraison confirmée',
            message: 'Le paiement a été traité avec succès. Le voyageur a reçu ses fonds.',
            type: 'success',
          });
          
          // Show rating modal after successful delivery confirmation
          if (shipment?.traveler_id && shipment?.traveler?.name) {
            setTimeout(() => {
              setModalState(prev => ({ ...prev, isOpen: false }));
              setRatingTarget({
                userId: shipment.traveler_id!,
                userName: shipment.traveler.name,
                userRole: 'traveler',
              });
              setShowRatingModal(true);
            }, 1500);
          }
        } catch (err) {
          setModalState({
            isOpen: true,
            title: 'Erreur',
            message: ErrorHandler.handle(err).message,
            type: 'error',
          });
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Expédition introuvable</p>
          <Button onClick={() => router.back()} className="mt-4">Retour</Button>
        </div>
      </div>
    );
  }

  const isSender = user?.id === shipment.sender_id;
  const isTraveler = user?.id === shipment.traveler_id;
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === shipment.status);
  const canConfirmDelivery = (isSender || isTraveler) && shipment.status === 'delivered' && shipment.payment_status === 'escrowed';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Suivi d'expédition</h1>
                <p className="text-sm text-slate-500">#{shipment.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            {shipment.payment_amount > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Montant</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(shipment.payment_amount)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Timeline de statut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Statut de l'expédition</h2>
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative grid grid-cols-4 gap-2">
              {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStepIndex;
                const isCurrent = step.key === shipment.status;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg scale-110'
                          : 'bg-slate-100 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`text-xs font-medium text-center ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions pour changer le statut */}
          {isTraveler && shipment.status !== 'delivered' && shipment.status !== 'cancelled' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">Actions voyageur</p>
              <div className="flex gap-2">
                {shipment.status === 'accepted' && (
                  <Button
                    onClick={() => handleUpdateStatus('in_transit')}
                    disabled={processing}
                    size="sm"
                    className="!bg-purple-500 hover:!bg-purple-600"
                  >
                    <Truck className="w-4 h-4 mr-1.5" />
                    Marquer en transit
                  </Button>
                )}
                {shipment.status === 'in_transit' && (
                  <Button
                    onClick={() => handleUpdateStatus('delivered')}
                    disabled={processing}
                    size="sm"
                    className="!bg-emerald-500 hover:!bg-emerald-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Marquer livré
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Confirmation de livraison */}
          {canConfirmDelivery && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900 mb-1">
                      Colis livré - Confirmation requise
                    </p>
                    <p className="text-xs text-emerald-700">
                      {isSender
                        ? 'Confirmez la réception pour débloquer le paiement au voyageur.'
                        : 'En attente de confirmation de l\'expéditeur pour recevoir votre paiement.'}
                    </p>
                  </div>
                </div>
              </div>
              {isSender && (
                <Button
                  onClick={handleConfirmDelivery}
                  disabled={processing}
                  loading={processing}
                  className="w-full !bg-emerald-500 hover:!bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer la livraison et débloquer le paiement
                </Button>
              )}
            </div>
          )}

          {shipment.payment_status === 'released' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Paiement effectué</p>
                    <p className="text-xs text-blue-700">
                      Le voyageur a reçu {formatCurrency(shipment.fees?.traveler_amount ?? shipment.payment_amount)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Rating button for delivered shipments */}
              {((isSender && shipment.traveler_id) || (isTraveler && shipment.sender_id)) && (
                <div className="mt-3">
                  <Button
                    onClick={() => {
                      if (isSender && shipment.traveler_id && shipment.traveler?.name) {
                        setRatingTarget({
                          userId: shipment.traveler_id,
                          userName: shipment.traveler.name,
                          userRole: 'traveler',
                        });
                        setShowRatingModal(true);
                      } else if (isTraveler && shipment.sender_id && shipment.sender?.name) {
                        setRatingTarget({
                          userId: shipment.sender_id,
                          userName: shipment.sender.name,
                          userRole: 'sender',
                        });
                        setShowRatingModal(true);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    ⭐ Évaluer {isSender ? 'le voyageur' : "l'expéditeur"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Itinéraire */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Itinéraire</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Collecte</p>
                  <p className="text-sm font-semibold text-slate-900">{shipment.pickup_city}, {shipment.pickup_country}</p>
                  {shipment.pickup_address && (
                    <p className="text-xs text-slate-500 mt-1">{shipment.pickup_address}</p>
                  )}
                </div>
              </div>

              <div className="ml-5 border-l-2 border-dashed border-slate-200 h-8" />

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Livraison</p>
                  <p className="text-sm font-semibold text-slate-900">{shipment.delivery_city}, {shipment.delivery_country}</p>
                  {shipment.delivery_address && (
                    <p className="text-xs text-slate-500 mt-1">{shipment.delivery_address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Détails du colis */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Détails du colis</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Weight className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Poids</p>
                  <p className="text-sm font-semibold text-slate-900">{shipment.package_weight} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Ruler className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Dimensions</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {shipment.package_length} × {shipment.package_width} × {shipment.package_height} cm
                  </p>
                </div>
              </div>
              {shipment.package_description && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-900">{shipment.package_description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expéditeur */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-500 mb-4">EXPÉDITEUR</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {shipment.sender?.name?.charAt(0).toUpperCase() || 'E'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{shipment.sender?.name || 'Expéditeur'}</p>
                <p className="text-xs text-slate-500">
                  ⭐ {Number(shipment.sender?.rating || 0).toFixed(1)} · {shipment.sender?.completed_deliveries || 0} expéditions
                </p>
              </div>
            </div>
            {/* Temporairement masqué - Chat désactivé
            {!isSender && (
              <Button
                onClick={() => router.push(`/messages?user=${shipment.sender_id}`)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contacter
              </Button>
            )}
            */}
          </div>

          {/* Voyageur */}
          {shipment.traveler && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">VOYAGEUR</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                  {shipment.traveler?.name?.charAt(0).toUpperCase() || 'V'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{shipment.traveler?.name || 'Voyageur'}</p>
                  <p className="text-xs text-slate-500">
                    ⭐ {Number(shipment.traveler?.rating || 0).toFixed(1)} · {shipment.traveler?.completed_deliveries || 0} expéditions
                  </p>
                </div>
              </div>
              {/* Temporairement masqué - Chat désactivé
              {!isTraveler && (
                <Button
                  onClick={() => router.push(`/messages?user=${shipment.traveler_id}`)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
              )}
              */}
            </div>
          )}
        </div>

        {/* Informations de paiement */}
        {shipment.payment_amount > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Informations de paiement</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Montant total</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(shipment.payment_amount)}</span>
              </div>
              {shipment.fees ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Part du voyageur ({100 - (shipment.fees.traveler_fee_percentage ?? 0)}%)</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(shipment.fees.traveler_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Frais de service ({(shipment.fees.sender_fee_percentage ?? 0) + (shipment.fees.traveler_fee_percentage ?? 0)}%)</span>
                    <span className="font-semibold text-slate-600">{formatCurrency(shipment.fees.platform_fee)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Part du voyageur</span>
                    <span className="font-semibold text-emerald-600">--</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Frais de service</span>
                    <span className="font-semibold text-slate-600">--</span>
                  </div>
                </>
              )}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    shipment.payment_status === 'escrowed' ? 'bg-amber-500' :
                    shipment.payment_status === 'released' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                  <span className="text-xs font-medium text-slate-600">
                    Statut: {
                      shipment.payment_status === 'escrowed' ? 'Fonds bloqués' :
                      shipment.payment_status === 'released' ? 'Paiement effectué' : shipment.payment_status
                    }
                  </span>
                </div>
              </div>
            </div>
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

      {/* Rating Modal */}
      {ratingTarget && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingTarget(null);
          }}
          shipmentId={params.id as string}
          toUserId={ratingTarget.userId}
          toUserName={ratingTarget.userName}
          userRole={ratingTarget.userRole}
          onSuccess={() => {
            setShowRatingModal(false);
            setRatingTarget(null);
            fetchShipment(); // Refresh to show updated ratings
          }}
        />
      )}
    </div>
  );
}
