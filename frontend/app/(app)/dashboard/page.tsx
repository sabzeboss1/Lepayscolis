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
import {
  Plane,
  Package,
  MessageCircle,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  PlaneTakeoff,
  Search,
  PackagePlus,
  ChevronRight,
  ArrowRight,
  Loader2,
  MapPin,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';

/* ── helpers ─────────────────────────────────── */
function getDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/* ── sub-components ───────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  accentColor,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  accentColor: string;
  bgColor: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-5 border"
      style={{ background: bgColor, borderColor: `${accentColor}22` }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: accentColor }}>
          {label}
        </p>
        <div className="text-lg font-bold text-navy">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-soft-gray flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-text" />
      </div>
      <p className="text-sm text-muted-text text-center">{text}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-soft-gray animate-pulse" />
      ))}
    </div>
  );
}

/* ── main page ────────────────────────────────── */
export default function DashboardPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { needsKYC, isKYCPending, isKYCRejected, isKYCNotSubmitted } = useKYCCheck();
  const router = useRouter();
  const { t } = useTranslation();

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (!authLoading && isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Only fetch data if user has KYC approved
      // For users without KYC, we'll show empty states with KYC prompts
      if (user.kyc_status !== 'approved') {
        setLoading(false);
        return;
      }

      try {
        const tripsResponse = await apiClient.get<PaginatedResponse<Trip>>(
          API_ENDPOINTS.trips.my
        );
        setActiveTrips(
          (tripsResponse.data || []).filter((trip) => trip.status === 'active')
        );

        const shipmentsResponse = await apiClient.get<PaginatedResponse<Shipment>>(
          API_ENDPOINTS.shipments.my
        );
        setPendingShipments(
          (shipmentsResponse.data || []).filter((s) => s.status === 'pending')
        );

        const conversationsResponse = await apiClient.get<{ data: Conversation[] }>(
          API_ENDPOINTS.messages.conversations
        );
        setRecentConversations((conversationsResponse.data || []).slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Don't show error to user - just show empty states
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-gray">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-royal-blue" />
          <p className="text-sm text-body-text">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  /* kyc config */
  const kycConfig = isKYCRejected
    ? {
        icon: XCircle,
        iconColor: '#ef4444',
        bg: 'rgba(239,68,68,0.06)',
        border: 'rgba(239,68,68,0.2)',
        titleColor: '#b91c1c',
        textColor: '#dc2626',
        title: t('dashboard.kycRejected') || 'Vérification KYC rejetée',
        description: 'Votre vérification a été rejetée. Soumettez à nouveau vos documents pour accéder à toutes les fonctionnalités.',
        btnLabel: 'Resoumettre les documents',
        btnVariant: 'primary' as const,
      }
    : isKYCPending
    ? {
        icon: Clock,
        iconColor: '#f59e0b',
        bg: 'rgba(245,158,11,0.06)',
        border: 'rgba(245,158,11,0.2)',
        titleColor: '#92400e',
        textColor: '#b45309',
        title: t('dashboard.kycPending') || 'Vérification KYC en cours',
        description: 'Vos documents sont en cours d\'examen. Cela prend généralement 1 à 2 jours ouvrables.',
        btnLabel: 'Voir le statut',
        btnVariant: 'outline' as const,
      }
    : isKYCNotSubmitted
    ? {
        icon: ShieldCheck,
        iconColor: '#2563eb',
        bg: 'rgba(37,99,235,0.05)',
        border: 'rgba(37,99,235,0.2)',
        titleColor: '#1e40af',
        textColor: '#1d4ed8',
        title: t('dashboard.kycRequired') || 'Complétez votre vérification KYC',
        description: 'Vous devez vérifier votre identité pour publier des voyages et créer des expéditions.',
        btnLabel: 'Compléter la vérification',
        btnVariant: 'primary' as const,
      }
    : {
        icon: ShieldCheck,
        iconColor: '#2563eb',
        bg: 'rgba(37,99,235,0.05)',
        border: 'rgba(37,99,235,0.2)',
        titleColor: '#1e40af',
        textColor: '#1d4ed8',
        title: t('dashboard.kycRequired') || 'Complétez votre vérification KYC',
        description: 'Vous devez vérifier votre identité pour publier des voyages et créer des expéditions.',
        btnLabel: 'Compléter la vérification',
        btnVariant: 'primary' as const,
      };

  return (
    <div className="min-h-screen bg-soft-gray">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── KYC Banner ── */}
        {needsKYC && (
          <div
            className="flex items-start gap-4 p-5 rounded-2xl border"
            style={{ background: kycConfig.bg, borderColor: kycConfig.border }}
            role="alert"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${kycConfig.iconColor}15` }}
            >
              <kycConfig.icon className="w-5 h-5" style={{ color: kycConfig.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-0.5" style={{ color: kycConfig.titleColor }}>
                {kycConfig.title}
              </p>
              <p className="text-sm mb-3" style={{ color: kycConfig.textColor }}>
                {kycConfig.description}
              </p>
              <Button
                variant={kycConfig.btnVariant}
                size="sm"
                onClick={() => router.push('/kyc')}
              >
                {kycConfig.btnLabel}
              </Button>
            </div>
          </div>
        )}

        {/* ── Welcome Banner ── */}
        <div
          className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a8a 60%, #1d4ed8 100%)',
          }}
        >
          {/* decorative */}
          <div
            className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full opacity-10 animate-blob"
            style={{ background: 'var(--color-vibrant-orange)' }}
          />
          <div
            className="absolute bottom-[-30px] right-[20%] w-32 h-32 rounded-full opacity-5 animate-blob animation-delay-2000"
            style={{ background: 'var(--color-ocean-blue)' }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {/* Avatar + greeting */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.2)' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wide">
                    {getDayGreeting()}
                  </p>
                  <h1
                    className="text-white text-xl sm:text-2xl font-bold leading-tight"
                    style={{ fontFamily: 'Prompt, sans-serif' }}
                  >
                    {user.name}
                    {user.is_recommended && (
                      <span
                        className="ml-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full align-middle"
                        style={{
                          background: 'rgba(249,115,22,0.2)',
                          color: '#fdba74',
                          border: '1px solid rgba(249,115,22,0.3)',
                        }}
                      >
                        <Star className="w-3 h-3" />
                        Recommandé
                      </span>
                    )}
                  </h1>
                </div>
              </div>

              <p className="text-white/50 text-sm ml-14">
                {loading
                  ? '…'
                  : activeTrips.length > 0
                  ? `${activeTrips.length} voyage(s) actif(s) · ${pendingShipments.length} expédition(s) en attente`
                  : 'Publiez un voyage ou recherchez un voyageur'}
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-2 sm:shrink-0">
              <Button
                size="sm"
                onClick={() => router.push('/trips/new')}
                className="!bg-vibrant-orange hover:!bg-warm-orange !text-white !rounded-xl font-semibold"
                style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
              >
                <PlaneTakeoff className="w-4 h-4 mr-1.5" />
                Publier un voyage
              </Button>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Star}
            label="Note"
            accentColor="#f59e0b"
            bgColor="#fffbeb"
            value={
              <div className="flex items-center gap-2">
                <RatingStars rating={Number(user.rating) || 0} size="sm" />
                <span>{(Number(user.rating) || 0).toFixed(1)}</span>
              </div>
            }
          />
          <StatCard
            icon={CheckCircle2}
            label="Livraisons complétées"
            accentColor="#10b981"
            bgColor="#f0fdf4"
            value={
              <span>
                {user.completed_deliveries}
                <span className="text-sm font-normal text-muted-text ml-1">colis</span>
              </span>
            }
          />
          <StatCard
            icon={ShieldCheck}
            label="Statut KYC"
            accentColor={
              user.kyc_status === 'approved'
                ? '#10b981'
                : user.kyc_status === 'pending'
                ? '#f59e0b'
                : user.kyc_status === 'rejected'
                ? '#ef4444'
                : '#2563eb'
            }
            bgColor={
              user.kyc_status === 'approved'
                ? '#f0fdf4'
                : user.kyc_status === 'pending'
                ? '#fffbeb'
                : user.kyc_status === 'rejected'
                ? '#fef2f2'
                : '#eff6ff'
            }
            value={
              <span
                style={{
                  color:
                    user.kyc_status === 'approved'
                      ? '#10b981'
                      : user.kyc_status === 'pending'
                      ? '#f59e0b'
                      : user.kyc_status === 'rejected'
                      ? '#ef4444'
                      : '#2563eb',
                }}
              >
                {user.kyc_status === 'approved'
                  ? 'Approuvé'
                  : user.kyc_status === 'pending'
                  ? 'En attente'
                  : user.kyc_status === 'rejected'
                  ? 'Rejeté'
                  : 'Non soumis'}
              </span>
            }
          />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-sm font-semibold text-body-text uppercase tracking-wide mb-3">
            Actions rapides
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Publish trip */}
            <button
              onClick={() => router.push('/trips/new')}
              className="group flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-white border border-light-border hover:border-royal-blue hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                }}
              >
                <PlaneTakeoff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-navy leading-tight">
                Publier un voyage
              </p>
              <p className="hidden sm:block text-xs text-muted-text mt-1">
                Gagnez en voyageant
              </p>
            </button>

            {/* Search trips */}
            <button
              onClick={() => router.push('/trips/search')}
              className="group flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-white border border-light-border hover:border-vibrant-orange hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200"
                style={{
                  background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                  boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                }}
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-navy leading-tight">
                Chercher un voyageur
              </p>
              <p className="hidden sm:block text-xs text-muted-text mt-1">
                Trouvez le bon profil
              </p>
            </button>

            {/* Create shipment */}
            <button
              onClick={() => router.push('/shipments/new')}
              className="group flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-white border border-light-border hover:border-success-green hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200"
                style={{
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                <PackagePlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-navy leading-tight">
                Créer une expédition
              </p>
              <p className="hidden sm:block text-xs text-muted-text mt-1">
                Envoyez un colis
              </p>
            </button>
          </div>
        </div>

        {/* ── Trips + Shipments Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Active Trips */}
          <Card className="!rounded-2xl !p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-light-border">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(37,99,235,0.1)' }}
                >
                  <Plane className="w-3.5 h-3.5" style={{ color: 'var(--color-royal-blue)' }} />
                </div>
                <h2 className="text-sm font-semibold text-navy">
                  Voyages actifs
                </h2>
                {!loading && activeTrips.length > 0 && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(37,99,235,0.1)',
                      color: 'var(--color-royal-blue)',
                    }}
                  >
                    {activeTrips.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => router.push('/trips/my')}
                className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-royal-blue)' }}
              >
                Voir tout
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4">
              {loading ? (
                <LoadingRows />
              ) : activeTrips.length > 0 ? (
                <div className="space-y-2">
                  {activeTrips.slice(0, 3).map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => router.push(`/trips/${trip.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-soft-gray transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(37,99,235,0.08)' }}
                        >
                          <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-royal-blue)' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy truncate">
                            {trip.departure_city} → {trip.arrival_city}
                          </p>
                          <p className="text-xs text-muted-text">
                            {formatDate(trip.departure_date)} – {formatDate(trip.arrival_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold text-navy">{trip.available_capacity} kg</p>
                        <p className="text-xs text-muted-text">{trip.price_per_kg_formatted || formatCurrency(trip.price_per_kg, trip.currency_code || 'EUR')}/kg</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Plane} text={t('dashboard.noActiveTrips') || 'Aucun voyage actif'} />
              )}
            </div>
          </Card>

          {/* Pending Shipments */}
          <Card className="!rounded-2xl !p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-light-border">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(249,115,22,0.1)' }}
                >
                  <Package className="w-3.5 h-3.5" style={{ color: 'var(--color-vibrant-orange)' }} />
                </div>
                <h2 className="text-sm font-semibold text-navy">
                  Expéditions en attente
                </h2>
                {!loading && pendingShipments.length > 0 && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(249,115,22,0.1)',
                      color: 'var(--color-vibrant-orange)',
                    }}
                  >
                    {pendingShipments.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => router.push('/shipments/my')}
                className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-vibrant-orange)' }}
              >
                Voir tout
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4">
              {loading ? (
                <LoadingRows />
              ) : pendingShipments.length > 0 ? (
                <div className="space-y-2">
                  {pendingShipments.slice(0, 3).map((shipment) => (
                    <button
                      key={shipment.id}
                      onClick={() => router.push(`/shipments/${shipment.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-soft-gray transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(249,115,22,0.08)' }}
                        >
                          <Package className="w-3.5 h-3.5" style={{ color: 'var(--color-vibrant-orange)' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy truncate">
                            {shipment.package_description}
                          </p>
                          <p className="text-xs text-muted-text truncate">
                            {shipment.pickup_city} → {shipment.delivery_city}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold text-navy">{shipment.package_weight} kg</p>
                        <span
                          className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(245,158,11,0.12)',
                            color: '#b45309',
                          }}
                        >
                          En attente
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Package} text={t('dashboard.noPendingShipments') || 'Aucune expédition en attente'} />
              )}
            </div>
          </Card>
        </div>

        {/* ── Recent Messages ── Temporairement masqué - Chat désactivé */}
        {false && (
        <Card className="!rounded-2xl !p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-light-border">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.1)' }}
              >
                <MessageCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-success-green)' }} />
              </div>
              <h2 className="text-sm font-semibold text-navy">Messages récents</h2>
            </div>
            <button
              onClick={() => router.push('/messages')}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-success-green)' }}
            >
              Voir tout
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <LoadingRows />
            ) : recentConversations.length > 0 ? (
              <div className="space-y-2">
                {recentConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => router.push(`/messages?conversation=${conversation.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-soft-gray transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      }}
                    >
                      {conversation.other_user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">
                        {conversation.other_user?.name || 'Inconnu'}
                      </p>
                      <p className="text-xs text-muted-text truncate">
                        {conversation.last_message?.content || '…'}
                      </p>
                    </div>

                    {conversation.unread_count > 0 && (
                      <span
                        className="w-5 h-5 flex items-center justify-center text-white text-xs font-bold rounded-full shrink-0"
                        style={{ background: 'var(--color-vibrant-orange)' }}
                      >
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={MessageCircle} text={t('dashboard.noRecentMessages') || 'Aucun message récent'} />
            )}
          </div>
        </Card>
        )}

      </div>
    </div>
  );
}
