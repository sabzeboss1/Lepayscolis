'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trip } from '@/lib/types/trip';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useRealtimeTripStatus } from '@/lib/hooks/useRealtimeStatusUpdates';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils/formatting';
import {
  ArrowLeft,
  Plane,
  Clock,
  Package,
  CheckCircle2,
  ShieldCheck,
  Star,
  MapPin,
  MessageCircle,
  PackagePlus,
  CalendarDays,
  FileText,
  Info,
  Lock,
  Globe,
  Scale,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────── */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateDuration(departure: string, arrival: string) {
  const diff = new Date(arrival).getTime() - new Date(departure).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}j ${hours > 0 ? `${hours}h` : ''}`.trim();
  return `${hours}h`;
}

/* ─── status chip ─────────────────────────────── */

const STATUS_CONFIG: Record<
  Trip['status'],
  { label: string; bg: string; text: string; dot: string }
> = {
  active:    { label: 'Actif',    bg: 'rgba(16,185,129,0.1)', text: '#059669', dot: '#10B981' },
  completed: { label: 'Terminé', bg: 'rgba(37,99,235,0.1)',  text: '#1d4ed8', dot: '#2563EB' },
  cancelled: { label: 'Annulé',  bg: 'rgba(239,68,68,0.1)', text: '#dc2626', dot: '#EF4444' },
};

function StatusChip({ status }: { status: Trip['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.dot }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}

/* ─── stat tile ───────────────────────────────── */

function StatTile({
  icon,
  label,
  value,
  iconColor = 'var(--color-royal-blue)',
  iconBg = 'rgba(37,99,235,0.08)',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">{label}</p>
        <p className="text-sm font-bold text-navy mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── info block ──────────────────────────────── */

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid var(--color-light-border)' }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--color-royal-blue)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-text mb-1">
          {label}
        </p>
        <div className="text-sm font-medium text-navy">{value}</div>
      </div>
    </div>
  );
}

/* ─── page ────────────────────────────────────── */

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useRealtimeTripStatus(tripId, (data) => {
    if (trip && data.id === tripId) {
      setTrip({ ...trip, status: data.status as Trip['status'] });
    }
  });

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const token = document.cookie.split('; ').find(r => r.startsWith('auth-token='))?.split('=')[1];
        const csrfToken = document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1];

        const response = await fetch(`/api/trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) setError(t('errors.notFound'));
          else if (response.status === 401) setError(t('errors.unauthorized'));
          else setError(t('errors.serverError'));
          return;
        }

        const data = await response.json();
        setTrip(data.data || data.trip || data);
      } catch (err) {
        setError(t('errors.networkError'));
        console.error('Fetch trip error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) fetchTrip();
  }, [tripId, t]);

  const handleContactTraveler = async () => {
    if (!trip) return;
    if (user?.id === trip.traveler_id) {
      alert(t('messages.cannotContactYourself') || 'Vous ne pouvez pas vous envoyer un message à vous-même.');
      return;
    }
    try {
      const token = document.cookie.split('; ').find(r => r.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1];

      const response = await fetch(`/api/messages/conversation-with/${trip.traveler_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.message || t('messages.errorCreatingConversation'));
        return;
      }

      const data = await response.json();
      router.push(data.data?.id ? `/messages/${data.data.id}` : '/messages');
    } catch {
      alert(t('messages.errorCreatingConversation') || 'Erreur lors de la création de la conversation');
    }
  };

  const handleRequestShipment = () => {
    if (trip) router.push(`/shipments/new?tripId=${trip.id}`);
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="inline-block w-12 h-12 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: 'var(--color-royal-blue)', borderRightColor: 'var(--color-vibrant-orange)' }}
          />
          <p className="text-sm text-muted-text font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center px-4">
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center"
          style={{ background: '#fff', border: '1px solid var(--color-light-border)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <Info className="w-8 h-8" style={{ color: '#EF4444' }} />
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">{t('common.error')}</h2>
          <p className="text-body-text mb-6">{error || t('errors.notFound')}</p>
          <Button variant="outline" onClick={() => router.back()}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const duration = calculateDuration(trip.departure_date, trip.arrival_date);
  const traveler = trip.traveler;

  return (
    <div className="min-h-screen bg-soft-gray">

      {/* ══ HERO BANNER ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a8a 50%, #1e40af 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'var(--color-vibrant-orange)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'var(--color-ocean-blue)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>

          {/* Route + price */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Route */}
            <div className="flex-1">
              <div className="flex items-center gap-4">
                {/* Departure city */}
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {trip.departure_country}
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                    {trip.departure_city}
                  </h1>
                </div>

                {/* Plane arrow */}
                <div className="flex flex-col items-center gap-1 px-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(249,115,22,0.2)' }}
                  >
                    <Plane className="w-4 h-4" style={{ color: 'var(--color-vibrant-orange)' }} />
                  </div>
                  <div
                    className="w-16 h-px"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(249,115,22,0.6))',
                    }}
                  />
                </div>

                {/* Arrival city */}
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {trip.arrival_country}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                    {trip.arrival_city}
                  </h2>
                </div>
              </div>

              {/* Date pills */}
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <CalendarDays className="w-3 h-3" />
                  Départ · {formatDate(trip.departure_date)}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <CalendarDays className="w-3 h-3" />
                  Arrivée · {formatDate(trip.arrival_date)}
                </span>
              </div>
            </div>

            {/* Price badge */}
            <div
              className="shrink-0 flex flex-col items-center md:items-end"
            >
              <div
                className="px-6 py-4 rounded-2xl text-center"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Prix / kg
                </p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: 'var(--color-vibrant-orange)', fontFamily: 'var(--font-heading)' }}
                >
                  {formatCurrency(trip.price_per_kg, trip.currency_code || 'EUR')}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {trip.available_capacity} kg disponibles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ STATS STRIP ══════════════════════════════════════════ */}
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ marginTop: '-1px' }}
      >
        <div
          className="flex flex-wrap gap-6 p-5 rounded-b-2xl"
          style={{
            background: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid var(--color-light-border)',
            borderTop: 'none',
          }}
        >
          <StatTile
            icon={<Clock className="w-5 h-5" />}
            label="Durée"
            value={duration}
          />
          <div className="w-px bg-light-border hidden sm:block" aria-hidden="true" />
          <StatTile
            icon={<Package className="w-5 h-5" />}
            label="Capacité"
            value={`${trip.available_capacity} kg`}
            iconColor="var(--color-vibrant-orange)"
            iconBg="rgba(249,115,22,0.08)"
          />
          <div className="w-px bg-light-border hidden sm:block" aria-hidden="true" />
          <StatTile
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Statut"
            value={<StatusChip status={trip.status} />}
            iconColor="var(--color-success-green)"
            iconBg="rgba(16,185,129,0.08)"
          />
          {trip.travel_proof_url && (
            <>
              <div className="w-px bg-light-border hidden sm:block" aria-hidden="true" />
              <StatTile
                icon={<FileText className="w-5 h-5" />}
                label="Preuve"
                value={
                  <a
                    href={`/api/trips/${trip.id}/travel-proof`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-xs font-semibold"
                    style={{ color: 'var(--color-royal-blue)' }}
                  >
                    Voir le document
                  </a>
                }
                iconColor="var(--color-success-green)"
                iconBg="rgba(16,185,129,0.08)"
              />
            </>
          )}
        </div>
      </div>

      {/* ══ MAIN CONTENT ════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Traveler card ── */}
        {traveler && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
              border: '1px solid var(--color-light-border)',
            }}
          >
            {/* Blue left accent + header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--color-light-border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ background: 'linear-gradient(180deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
                  aria-hidden="true"
                />
                <h2 className="text-base font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                  {t('trips.travelerInfo')}
                </h2>
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="relative w-20 h-20">
                    {traveler.avatar ? (
                      <img
                        src={traveler.avatar}
                        alt={traveler.name}
                        className="w-20 h-20 rounded-2xl object-cover"
                        style={{ border: '2px solid var(--color-light-border)' }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                        style={{ background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)' }}
                      >
                        {traveler.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {traveler.kyc_status === 'approved' && (
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-royal-blue)', border: '2px solid #fff' }}
                        aria-label="Identité vérifiée"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3
                      className="text-xl font-bold text-navy"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {traveler.name}
                    </h3>
                    {traveler.is_recommended && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: 'rgba(249,115,22,0.1)', color: '#c2410c' }}
                      >
                        <Star className="w-3 h-3" />
                        Recommandé
                      </span>
                    )}
                    {traveler.kyc_status === 'approved' && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--color-royal-blue)' }}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Vérifié
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <RatingStars rating={traveler.rating} size="sm" />
                    <span className="text-sm font-semibold text-navy">
                      {traveler.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-text">
                      · {traveler.completed_deliveries} livraison(s) complétée(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-5" style={{ borderTop: '1px solid var(--color-light-border)' }}>
                <Button
                  variant="primary"
                  onClick={handleContactTraveler}
                  className="flex-1 gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('trips.contactTraveler')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRequestShipment}
                  className="flex-1 gap-2"
                >
                  <PackagePlus className="w-4 h-4" />
                  {t('trips.requestShipment')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Trip details ── */}
        <div
          className="rounded-2xl"
          style={{
            background: '#fff',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: '1px solid var(--color-light-border)',
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: '1px solid var(--color-light-border)' }}
          >
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: 'linear-gradient(180deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
              aria-hidden="true"
            />
            <h2 className="text-base font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
              Détails du voyage
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoBlock
              icon={<MapPin className="w-4 h-4" />}
              label="Adresse de collecte"
              value={trip.pickup_address || '—'}
            />
            <InfoBlock
              icon={<MapPin className="w-4 h-4" />}
              label="Adresse de livraison"
              value={trip.delivery_address || '—'}
            />
            {trip.accepted_package_types?.length > 0 && (
              <div className="sm:col-span-2">
                <InfoBlock
                  icon={<Package className="w-4 h-4" />}
                  label="Types de colis acceptés"
                  value={
                    <div className="flex flex-wrap gap-2 mt-1">
                      {trip.accepted_package_types.map((type) => (
                        <span
                          key={type}
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: 'rgba(37,99,235,0.08)',
                            color: 'var(--color-royal-blue)',
                          }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Trust & Safety ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(249,115,22,0.04) 100%)',
            border: '1px solid rgba(37,99,235,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: 'linear-gradient(180deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
              aria-hidden="true"
            />
            <h2 className="text-base font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
              Informations importantes
            </h2>
          </div>

          <ul className="space-y-3">
            {[
              {
                icon: <MessageCircle className="w-4 h-4" />,
                text: 'Contactez le voyageur pour discuter des détails du colis et des modalités de livraison.',
              },
              {
                icon: <Lock className="w-4 h-4" />,
                text: 'Le paiement est conservé en séquestre jusqu\'à la confirmation de la livraison.',
              },
              {
                icon: <Globe className="w-4 h-4" />,
                text: 'Assurez-vous que votre colis respecte les réglementations douanières des deux pays.',
              },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--color-royal-blue)' }}
                >
                  {icon}
                </div>
                <p className="text-sm text-body-text leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
