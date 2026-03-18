'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, User, MapPin, Ban, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Shipment {
  id: string;
  tracking_number: string;
  sender: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  delivery_city: string;
  delivery_country: string;
  delivery_address?: string;
  pickup_city: string;
  pickup_country: string;
  pickup_address?: string;
  package_description: string;
  package_weight: number;
  package_length?: number;
  package_width?: number;
  package_height?: number;
  trip?: {
    id: string;
    origin: string;
    destination: string;
    traveler_name?: string;
  } | null;
  payment_amount: number;
  payment_status: string;
  payment?: { id: string; amount: number; status: string } | null;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  note?: string;
}

interface Analytics {
  delivery_time_days: number;
  on_time_delivery: boolean;
}

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setShipmentId(p.id));
  }, [params]);

  useEffect(() => {
    if (shipmentId) fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}`);
      const data = await response.json();
      setShipment(data.data?.shipment ?? null);
      setStatusHistory(data.data?.status_history ?? []);
      setAnalytics(data.data?.analytics ?? null);
    } catch (error) {
      console.error('Failed to fetch shipment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelShipment = async () => {
    if (!shipmentId || cancelReason.trim().length < 10) return;
    setCancelLoading(true);
    try {
      await fetch(`/api/admin/shipments/${shipmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      await fetchShipmentDetails();
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel shipment:', error);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.shipments.detail.notFound')}</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] ?? 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.shipments.statuses.${status}`) || status}
      </span>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);

  const hasDimensions = shipment.package_length || shipment.package_width || shipment.package_height;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.shipments.detail.title')}</h1>
            <p className="text-sm text-gray-600 mt-1 font-mono">{shipment.tracking_number}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <Ban className="w-4 h-4 mr-2" />
              {t('admin.shipments.detail.cancelShipment')}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.shipments.detail.packageInfo')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.shipments.detail.description')}</label>
                <div className="mt-1 text-sm text-gray-900">{shipment.package_description || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.shipments.detail.weight')}</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                  {shipment.package_weight} kg
                </div>
              </div>
              {hasDimensions && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('admin.shipments.detail.dimensions')}</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {[shipment.package_length, shipment.package_width, shipment.package_height]
                      .filter(Boolean)
                      .join(' × ')} cm
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.shipments.detail.route')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.shipments.detail.pickup')}</label>
                <div className="mt-1 text-sm text-gray-900 flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div>{shipment.pickup_city}{shipment.pickup_country ? `, ${shipment.pickup_country}` : ''}</div>
                    {shipment.pickup_address && (
                      <div className="text-gray-500 text-xs mt-0.5">{shipment.pickup_address}</div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.shipments.detail.delivery')}</label>
                <div className="mt-1 text-sm text-gray-900 flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div>{shipment.delivery_city}{shipment.delivery_country ? `, ${shipment.delivery_country}` : ''}</div>
                    {shipment.delivery_address && (
                      <div className="text-gray-500 text-xs mt-0.5">{shipment.delivery_address}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sender */}
          {shipment.sender && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.shipments.detail.sender')}</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <button
                    onClick={() => router.push(`/admin/users/${shipment.sender!.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {shipment.sender.name}
                  </button>
                </div>
                <div className="text-sm text-gray-900 ml-7">{shipment.sender.email}</div>
                {shipment.sender.phone && (
                  <div className="text-sm text-gray-900 ml-7">{shipment.sender.phone}</div>
                )}
              </div>
            </div>
          )}

          {/* Trip Info */}
          {shipment.trip && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.shipments.detail.associatedTrip')}</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-24">{t('admin.shipments.detail.route')}:</span>
                  <button
                    onClick={() => router.push(`/admin/trips/${shipment.trip!.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {shipment.trip.origin} → {shipment.trip.destination}
                  </button>
                </div>
                {shipment.trip.traveler_name && (
                  <div className="flex items-center text-sm">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-24">{t('admin.shipments.detail.traveler')}:</span>
                    <span className="text-gray-900">{shipment.trip.traveler_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.shipments.detail.statusHistory')}</h2>
              <div className="space-y-4">
                {statusHistory.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(item.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {item.note && <p className="text-sm text-gray-600 mt-1">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.shipments.detail.statusSection')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.shipments.detail.currentStatus')}</label>
                <div className="mt-1">{getStatusBadge(shipment.status)}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.shipments.detail.created')}</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(shipment.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
              {shipment.status === 'delivered' && (
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.shipments.detail.delivered')}</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(shipment.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.shipments.detail.payment')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.shipments.detail.paymentAmount')}</label>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(shipment.payment_amount)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.shipments.detail.paymentStatus')}</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    shipment.payment_status === 'released'
                      ? 'bg-green-100 text-green-800'
                      : shipment.payment_status === 'refunded'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {shipment.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('admin.shipments.detail.analytics')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.shipments.detail.deliveryTime')}</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {analytics.delivery_time_days} {t('admin.shipments.detail.days')}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.shipments.detail.onTimeDelivery')}</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      analytics.on_time_delivery ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {analytics.on_time_delivery ? t('common.yes') : t('common.no')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('admin.shipments.detail.cancelDialog.title')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.shipments.detail.cancelDialog.description')}
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('admin.shipments.detail.cancelDialog.placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${cancelReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                {cancelReason.length} / 10 {t('common.characters')}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('admin.shipments.detail.cancelDialog.cancel')}
                </button>
                <button
                  onClick={handleCancelShipment}
                  disabled={cancelReason.length < 10 || cancelLoading}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? t('common.processing') : t('admin.shipments.detail.cancelDialog.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
