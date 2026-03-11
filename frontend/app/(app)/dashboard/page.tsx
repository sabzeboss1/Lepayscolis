'use client';

import { useAuth } from '@/lib/auth';
import { useKYCCheck } from '@/lib/hooks/useKYCCheck';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useEffect, useState } from 'react';
import { Trip, Shipment, Conversation } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { PaginatedResponse } from '@/lib/types/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const { needsKYC, isKYCPending, isKYCRejected } = useKYCCheck();
  const router = useRouter();
  const { t } = useTranslation();

  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user's trips (paginated response)
        const tripsResponse = await apiClient.get<PaginatedResponse<Trip>>(
          API_ENDPOINTS.trips.my
        );
        setActiveTrips(
          (tripsResponse.data || []).filter((trip) => trip.status === 'active')
        );

        // Fetch user's shipments (paginated response)
        const shipmentsResponse = await apiClient.get<PaginatedResponse<Shipment>>(
          API_ENDPOINTS.shipments.my
        );
        setPendingShipments(
          (shipmentsResponse.data || []).filter((s) => s.status === 'pending')
        );

        // Fetch recent conversations
        const conversationsResponse = await apiClient.get<{ data: Conversation[] }>(
          API_ENDPOINTS.messages.conversations
        );
        setRecentConversations(
          (conversationsResponse.data || []).slice(0, 3)
        );
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* KYC Status Banner */}
        {needsKYC && (
          <div className={`mb-6 p-5 rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${isKYCRejected
            ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300'
            : isKYCPending
              ? 'bg-gradient-to-r from-amber-50 to-orange-100 border-amber-300'
              : 'bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-300'
            }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isKYCRejected ? 'bg-red-200' : isKYCPending ? 'bg-amber-200' : 'bg-blue-200'
                }`}>
                {isKYCRejected ? '!' : isKYCPending ? '...' : '#'}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${isKYCRejected
                  ? 'text-red-800'
                  : isKYCPending
                    ? 'text-orange-800'
                    : 'text-blue-800'
                  }`}>
                  {isKYCRejected
                    ? t('dashboard.kycRejected') || 'KYC Verification Rejected'
                    : isKYCPending
                      ? t('dashboard.kycPending') || 'KYC Verification Pending'
                      : t('dashboard.kycRequired') || 'Complete KYC Verification'}
                </h3>
                <p className={`text-sm mb-3 ${isKYCRejected
                  ? 'text-red-700'
                  : isKYCPending
                    ? 'text-orange-700'
                    : 'text-blue-700'
                  }`}>
                  {isKYCRejected
                    ? 'Your verification was rejected. Please resubmit your documents to access all features.'
                    : isKYCPending
                      ? 'Your documents are under review. This usually takes 1-2 business days.'
                      : 'You need to complete identity verification to publish trips and create shipments.'}
                </p>
                {isKYCPending ? (
                  <Button variant="outline" size="sm" onClick={() => router.push('/kyc')}>
                    View KYC Status
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => router.push('/kyc')}>
                    {isKYCRejected ? 'Resubmit Documents' : 'Complete Verification'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
            <span className="text-gray-900">{t('dashboard.welcome', { name: '' })}</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {activeTrips.length > 0
              ? `${activeTrips.length} voyage(s) actif(s) - ${pendingShipments.length} expedition(s)`
              : 'Publiez un voyage ou recherchez des voyageurs'}
          </p>
          {user.is_recommended && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-100 border border-yellow-300 rounded-lg px-3 py-2 mt-3 shadow-sm">
              <span className="text-lg">*</span>
              <p className="text-yellow-800 font-semibold text-xs">Membre recommande</p>
            </div>
          )}
        </div>

        {/* Quick Actions - Compact on mobile */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
            {t('dashboard.quickActions')}
          </h2>

          {/* Mobile: Horizontal compact layout */}
          <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden">
            <Card hoverable onClick={() => router.push('/trips/new')} className="cursor-pointer flex-shrink-0 w-32 border border-blue-200 hover:border-blue-400">
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-2 shadow">
                  <span className="text-lg">+</span>
                </div>
                <h3 className="text-xs font-bold text-gray-900">Publier voyage</h3>
              </div>
            </Card>

            <Card hoverable onClick={() => router.push('/trips/search')} className="cursor-pointer flex-shrink-0 w-32 border border-orange-200 hover:border-orange-400">
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-2 shadow">
                  <span className="text-lg">?</span>
                </div>
                <h3 className="text-xs font-bold text-gray-900">Chercher voyage</h3>
              </div>
            </Card>

            <Card hoverable onClick={() => router.push('/shipments/new')} className="cursor-pointer flex-shrink-0 w-32 border border-green-200 hover:border-green-400">
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-2 shadow">
                  <span className="text-lg">+</span>
                </div>
                <h3 className="text-xs font-bold text-gray-900">Expedition</h3>
              </div>
            </Card>
          </div>

          {/* Desktop/Tablet: Original grid layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card hoverable onClick={() => router.push('/trips/new')} className="cursor-pointer group border-2 border-transparent hover:border-blue-300 transition-all">
              <div className="flex flex-col items-center text-center p-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">+</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {t('dashboard.publishTrip')}
                </h3>
                <p className="text-xs text-gray-500">
                  Gagnez de l'argent en voyageant
                </p>
              </div>
            </Card>

            <Card hoverable onClick={() => router.push('/trips/search')} className="cursor-pointer group border-2 border-transparent hover:border-orange-300 transition-all">
              <div className="flex flex-col items-center text-center p-5">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">?</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {t('dashboard.searchTrips')}
                </h3>
                <p className="text-xs text-gray-500">
                  Trouvez un voyageur
                </p>
              </div>
            </Card>

            <Card hoverable onClick={() => router.push('/shipments/new')} className="cursor-pointer group border-2 border-transparent hover:border-green-300 transition-all sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col items-center text-center p-5">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">+</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {t('dashboard.createShipment')}
                </h3>
                <p className="text-xs text-gray-500">
                  Creer une expedition
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* User Statistics - Sidebar on desktop */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="h-full bg-gradient-to-br from-white to-gray-50">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t('dashboard.statistics')}
              </h2>
              <p className="text-gray-500 text-sm mb-4">Votre activite en un coup d'oeil</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow">
                    <span className="text-xl text-white">*</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">{t('profile.rating')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <RatingStars rating={Number(user.rating) || 0} size="sm" />
                      <span className="text-2xl font-bold text-blue-600">
                        {(Number(user.rating) || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow">
                    <span className="text-xl text-white">#</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide">
                      {t('profile.completedDeliveries')}
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {user.completed_deliveries}
                      <span className="text-sm font-normal text-green-500 ml-1">colis</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-orange-100">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow ${user.kyc_status === 'approved'
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : user.kyc_status === 'pending'
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-red-400 to-red-600'
                    }`}>
                    <span className="text-xl text-white">
                      {user.kyc_status === 'approved' ? 'V' : user.kyc_status === 'pending' ? '...' : 'X'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-orange-700 font-medium uppercase tracking-wide">
                      {t('profile.kycStatus')}
                    </p>
                    <p className={`text-lg font-bold mt-1 ${user.kyc_status === 'approved' ? 'text-green-600'
                      : user.kyc_status === 'pending' ? 'text-orange-600'
                        : 'text-red-600'
                      }`}>
                      {user.kyc_status === 'approved' ? t('profile.kycApproved') :
                        user.kyc_status === 'pending' ? t('profile.kycPending') :
                          t('profile.kycRejected')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Active Trips and Pending Shipments - Main content */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Active Trips */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('dashboard.activeTrips')}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => router.push('/trips/my')}>
                  {t('common.viewDetails')}
                </Button>
              </div>
              {loading ? (
                <p className="text-gray-600">{t('common.loading')}</p>
              ) : activeTrips.length > 0 ? (
                <div className="space-y-3">
                  {activeTrips.slice(0, 3).map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/trips/${trip.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {trip.departure_city} &rarr; {trip.arrival_city}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(trip.departure_date).toLocaleDateString()} - {new Date(trip.arrival_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {trip.available_capacity} kg
                        </p>
                        <p className="text-sm text-gray-600">
                          {trip.price_per_kg}/kg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">
                  {t('dashboard.noActiveTrips')}
                </p>
              )}
            </Card>

            {/* Pending Shipments */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('dashboard.pendingShipments')}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => router.push('/shipments/my')}>
                  {t('common.viewDetails')}
                </Button>
              </div>
              {loading ? (
                <p className="text-gray-600">{t('common.loading')}</p>
              ) : pendingShipments.length > 0 ? (
                <div className="space-y-3">
                  {pendingShipments.slice(0, 3).map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/shipments/${shipment.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {shipment.package_description}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shipment.pickup_city} &rarr; {shipment.delivery_city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {shipment.package_weight} kg
                        </p>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          {t('shipments.pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">
                  {t('dashboard.noPendingShipments')}
                </p>
              )}
            </Card>
          </div>
        </div>

        {/* Recent Messages */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboard.recentMessages')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/messages')}>
              {t('common.viewDetails')}
            </Button>
          </div>
          {loading ? (
            <p className="text-gray-600">{t('common.loading')}</p>
          ) : recentConversations.length > 0 ? (
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/messages?conversation=${conversation.id}`)}
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {conversation.other_user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {conversation.other_user?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message?.content || ''}
                    </p>
                  </div>
                  {conversation.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              {t('dashboard.noRecentMessages')}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
