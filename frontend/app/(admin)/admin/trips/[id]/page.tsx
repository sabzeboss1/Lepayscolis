'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, MapPin, Calendar, User, Package, TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Trip {
  id: string;
  traveler: { id: string; name: string; email: string; phone: string };
  origin: string;
  destination: string;
  departure_date: string;
  arrival_date: string;
  available_space: number;
  price_per_kg: number;
  currency_code: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'active';
  verification_status: 'pending' | 'verified' | 'rejected';
  cancellation_reason?: string;
  rejection_reason?: string;
  verified_by?: { id: string; name: string };
  verified_at?: string;
  travel_proof_url?: string;
  created_at: string;
}

interface Shipment {
  id: string;
  tracking_number: string;
  sender_name: string;
  recipient_city: string;
  recipient_country: string;
  weight: number;
  status: string;
  price: number;
}

interface Analytics {
  total_shipments: number;
  total_revenue: number;
  completion_rate: number;
  average_rating: number | null;
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [tripId, setTripId] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Verify action
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    params.then(p => setTripId(p.id));
  }, [params]);

  useEffect(() => {
    if (tripId) fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/trips/${tripId}`);
      const data = await response.json();
      setTrip(data.data?.trip ?? null);
      setShipments(data.data?.shipments ?? []);
      setAnalytics(data.data?.analytics ?? null);
    } catch (error) {
      console.error('Failed to fetch trip details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!tripId || cancelReason.length < 10) return;
    setIsCancelling(true);
    try {
      await fetch(`/api/admin/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      fetchTripDetails();
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel trip:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleVerifyTrip = async () => {
    if (!tripId) return;
    setIsVerifying(true);
    try {
      await fetch(`/api/admin/trips/${tripId}/verify`, { method: 'POST' });
      fetchTripDetails();
    } catch (error) {
      console.error('Failed to verify trip:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectTrip = async () => {
    if (!tripId || rejectReason.length < 10) return;
    setIsRejecting(true);
    try {
      await fetch(`/api/admin/trips/${tripId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      fetchTripDetails();
      setShowRejectDialog(false);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to reject trip:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const formatCurrency = (amount: number, code?: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code || 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.trips.statuses.${status}`) || status}
      </span>
    );
  };

  const getVerificationBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.trips.verificationStatuses.${status}`) || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('admin.trips.detail.tripNotFound')}</p>
        </div>
      </div>
    );
  }

  const canCancel = trip.status === 'upcoming' || trip.status === 'active';
  const canVerify = trip.verification_status === 'pending';

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
            <h1 className="text-2xl font-bold text-gray-900">
              {trip.origin} → {trip.destination}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{t('admin.trips.detail.tripId')}: {trip.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canVerify && (
            <>
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={isVerifying}
                className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t('admin.trips.detail.rejectTrip')}
              </button>
              <button
                onClick={handleVerifyTrip}
                disabled={isVerifying}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {t('admin.trips.detail.verifyTrip')}
              </button>
            </>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <Ban className="w-4 h-4 mr-2" />
              {t('admin.trips.detail.cancelTrip')}
            </button>
          )}
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.trips.detail.tripInfo')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.trips.detail.origin')}</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {trip.origin}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.trips.detail.destination')}</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {trip.destination}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.trips.detail.departureDate')}</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(trip.departure_date).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.trips.detail.arrivalDate')}</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(trip.arrival_date).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.trips.detail.availableSpace')}</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                  {trip.available_space} kg
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.trips.detail.pricePerKg')}</label>
                <div className="mt-1 text-sm text-gray-900">
                  {formatCurrency(trip.price_per_kg, trip.currency_code)}
                </div>
              </div>
            </div>

            {trip.status === 'cancelled' && trip.cancellation_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">{t('admin.trips.detail.cancellationReason')}</p>
                <p className="text-sm text-red-700 mt-1">{trip.cancellation_reason}</p>
              </div>
            )}

            {trip.verification_status === 'rejected' && trip.rejection_reason && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900">{t('admin.trips.detail.rejectionReason')}</p>
                <p className="text-sm text-orange-700 mt-1">{trip.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Traveler Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.trips.detail.travelerInfo')}</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">{t('admin.trips.detail.name')}:</span>
                <button
                  onClick={() => router.push(`/admin/users/${trip.traveler.id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {trip.traveler.name}
                </button>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 w-24 ml-7">{t('admin.trips.detail.email')}:</span>
                <span className="text-gray-900">{trip.traveler.email}</span>
              </div>
              {trip.traveler.phone && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24 ml-7">{t('admin.trips.detail.phone')}:</span>
                  <span className="text-gray-900">{trip.traveler.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Associated Shipments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('admin.trips.detail.shipments')} ({shipments.length})
            </h2>
            {shipments.length === 0 ? (
              <p className="text-sm text-gray-500">{t('admin.trips.detail.noShipments')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.trips.detail.shipmentTracking')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.trips.detail.shipmentSender')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.trips.detail.shipmentRecipient')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.trips.detail.shipmentWeight')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.trips.detail.shipmentStatus')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.trips.detail.shipmentPrice')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        onClick={() => router.push(`/admin/shipments/${shipment.id}`)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{shipment.tracking_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{shipment.sender_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {shipment.recipient_city}{shipment.recipient_country ? `, ${shipment.recipient_country}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{shipment.weight} kg</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {shipment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(shipment.price, trip.currency_code)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.trips.detail.statusSection')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.tripStatus')}</label>
                <div className="mt-1">{getStatusBadge(trip.status)}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.verificationStatusLabel')}</label>
                <div className="mt-1">{getVerificationBadge(trip.verification_status)}</div>
              </div>
              {trip.verified_by && (
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.verifiedBy')}</label>
                  <div className="mt-1 text-sm text-gray-900">{trip.verified_by.name}</div>
                </div>
              )}
              {trip.verified_at && (
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.verifiedAt')}</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(trip.verified_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.created')}</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(trip.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('admin.trips.detail.analytics')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.totalShipments')}</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{analytics.total_shipments}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.totalRevenue')}</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(analytics.total_revenue, trip.currency_code)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.completionRate')}</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{analytics.completion_rate}%</div>
                </div>
                {analytics.average_rating !== null && analytics.average_rating !== undefined && analytics.average_rating > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">{t('admin.trips.detail.averageRating')}</label>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {analytics.average_rating.toFixed(1)} / 5.0
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.trips.detail.cancelDialog.title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('admin.trips.detail.cancelDialog.description')}</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('admin.trips.detail.cancelDialog.placeholder')}
              rows={4}
              disabled={isCancelling}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none disabled:bg-gray-100"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${cancelReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                {cancelReason.length} / 10 minimum
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}
                  disabled={isCancelling}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('admin.trips.detail.cancelDialog.cancel')}
                </button>
                <button
                  onClick={handleCancelTrip}
                  disabled={isCancelling || cancelReason.length < 10}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isCancelling && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {t('admin.trips.detail.cancelDialog.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.trips.detail.rejectDialog.title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('admin.trips.detail.rejectDialog.description')}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('admin.trips.detail.rejectDialog.placeholder')}
              rows={4}
              disabled={isRejecting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none disabled:bg-gray-100"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${rejectReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                {rejectReason.length} / 10 minimum
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}
                  disabled={isRejecting}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('admin.trips.detail.rejectDialog.cancel')}
                </button>
                <button
                  onClick={handleRejectTrip}
                  disabled={isRejecting || rejectReason.length < 10}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isRejecting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {t('admin.trips.detail.rejectDialog.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
