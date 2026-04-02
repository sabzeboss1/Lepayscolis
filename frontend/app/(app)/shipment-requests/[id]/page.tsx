'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import { apiClient } from '@/lib/api/client';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import {
  Package,
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Users,
  User,
  Weight,
  Ruler,
  AlertCircle,
  CheckCircle2,
  Send,
  ArrowRight,
  Star,
  CalendarDays,
  FileText,
  Info,
  ShieldCheck,
} from 'lucide-react';

/* ─── types ──────────────────────────────────── */

interface ShipmentRequest {
  id: string;
  title: string;
  description: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  declared_value: number;
  package_type: string;
  photo_urls: string[];
  recipient_name: string;
  recipient_phone: string;
  pickup_country: { name: string };
  pickup_city: { name: string };
  pickup_address: string;
  delivery_country: { name: string };
  delivery_city: { name: string };
  delivery_address: string;
  max_budget: number;
  currency_code: string;
  status: string;
  needed_by: string | null;
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    completed_deliveries: number;
    kyc_status?: string;
  };
  bids: Array<{
    id: string;
    proposed_price: number;
    currency_code: string;
    message: string;
    proposed_pickup_date: string;
    proposed_delivery_date: string;
    status: string;
    traveler: {
      id: string;
      name: string;
      avatar?: string;
      rating: number;
      completed_deliveries: number;
    };
  }>;
}

/* ─── status chip ────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  open:      { label: 'Ouvert',   bg: 'rgba(16,185,129,0.15)', text: '#059669', dot: '#10B981' },
  closed:    { label: 'Fermé',    bg: 'rgba(37,99,235,0.15)',  text: '#1d4ed8', dot: '#2563EB' },
  cancelled: { label: 'Annulé',   bg: 'rgba(239,68,68,0.15)', text: '#dc2626', dot: '#EF4444' },
};

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

/* ─── stat tile ──────────────────────────────── */

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
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-text)' }}>
          {label}
        </p>
        <p className="text-sm font-bold" style={{ color: 'var(--color-navy)', marginTop: '2px' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── info block ─────────────────────────────── */

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
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
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted-text)' }}>
          {label}
        </p>
        <div className="text-sm font-medium" style={{ color: 'var(--color-navy)' }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── card header ────────────────────────────── */

function CardHeader({ title }: { title: string }) {
  return (
    <div
      className="flex items-center gap-2 px-5 py-4"
      style={{ borderBottom: '1px solid var(--color-light-border)' }}
    >
      <div
        className="w-1 h-5 rounded-full"
        style={{ background: 'linear-gradient(180deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
        aria-hidden="true"
      />
      <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
        {title}
      </h2>
    </div>
  );
}

/* ─── page ───────────────────────────────────── */

export default function ShipmentRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { formatCurrency } = useUserCurrency();
  const { currencyCode } = useUserCurrency();

  const [request, setRequest] = useState<ShipmentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidPickupDate, setBidPickupDate] = useState('');
  const [bidDeliveryDate, setBidDeliveryDate] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await apiClient.get<{ data: ShipmentRequest }>(`/api/shipment-requests/${params.id}`);
        setRequest(response.data);
      } catch (err) {
        console.error('Failed to fetch shipment request:', err);
        setError("Erreur lors du chargement de l'annonce");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchRequest();
  }, [params.id]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidPrice || !bidPickupDate || !bidDeliveryDate || !request) return;
    setSubmittingBid(true);
    try {
      await apiClient.post(`/api/shipment-requests/${request.id}/bids`, {
        proposed_price: parseFloat(bidPrice),
        currency_code: currencyCode || request.currency_code,
        message: bidMessage,
        proposed_pickup_date: bidPickupDate,
        proposed_delivery_date: bidDeliveryDate,
      });
      const response = await apiClient.get<{ data: ShipmentRequest }>(`/api/shipment-requests/${params.id}`);
      setRequest(response.data);
      setBidPrice('');
      setBidMessage('');
      setBidPickupDate('');
      setBidDeliveryDate('');
      alert('Soumission envoyée avec succès !');
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err);
      alert(`Erreur: ${errorMessage.message}`);
    } finally {
      setSubmittingBid(false);
    }
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="inline-block w-12 h-12 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor: 'var(--color-royal-blue)',
              borderRightColor: 'var(--color-vibrant-orange)',
            }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--color-muted-text)' }}>
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (error || !request) {
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
            <AlertCircle className="w-8 h-8" style={{ color: '#EF4444' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
            Erreur
          </h2>
          <p className="mb-6" style={{ color: 'var(--color-body-text)' }}>{error || 'Annonce non trouvée'}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === request.sender.id;
  const canBid = !isOwner && request.status === 'open';
  const bidCount = request.bids?.length || 0;
  const senderInitial = request.sender.name.charAt(0).toUpperCase();

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

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 transition-colors mb-8 group"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            aria-label="Retour"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium hover:text-white">Retour</span>
          </button>

          {/* Title row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(249,115,22,0.2)' }}
                >
                  <Package className="w-6 h-6" style={{ color: 'var(--color-vibrant-orange)' }} />
                </div>
                <StatusChip status={request.status} />
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold text-white leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {request.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <CalendarDays className="w-3 h-3" />
                  Publié le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <Package className="w-3 h-3" />
                  {request.package_type}
                </span>
              </div>
            </div>

            {/* Budget badge */}
            {request.max_budget > 0 && (
              <div className="shrink-0">
                <div
                  className="px-6 py-4 rounded-2xl text-center"
                  style={{
                    background: 'rgba(249,115,22,0.15)',
                    border: '1px solid rgba(249,115,22,0.3)',
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    Budget max
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: 'var(--color-vibrant-orange)', fontFamily: 'var(--font-heading)' }}
                  >
                    {formatCurrency(request.max_budget, request.currency_code)}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {bidCount} soumission{bidCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ STATS STRIP ══════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" style={{ marginTop: '-1px' }}>
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
            icon={<Weight className="w-5 h-5" />}
            label="Poids"
            value={`${request.weight} kg`}
          />
          <div className="w-px hidden sm:block" style={{ background: 'var(--color-light-border)' }} aria-hidden="true" />
          <StatTile
            icon={<Ruler className="w-5 h-5" />}
            label="Dimensions"
            value={`${request.length} × ${request.width} × ${request.height} cm`}
            iconColor="var(--color-vibrant-orange)"
            iconBg="rgba(249,115,22,0.08)"
          />
          <div className="w-px hidden sm:block" style={{ background: 'var(--color-light-border)' }} aria-hidden="true" />
          <StatTile
            icon={<Users className="w-5 h-5" />}
            label="Soumissions"
            value={`${bidCount} reçue${bidCount !== 1 ? 's' : ''}`}
            iconColor="var(--color-success-green)"
            iconBg="rgba(16,185,129,0.08)"
          />
          {request.needed_by && (
            <>
              <div className="w-px hidden sm:block" style={{ background: 'var(--color-light-border)' }} aria-hidden="true" />
              <StatTile
                icon={<Clock className="w-5 h-5" />}
                label="Date limite"
                value={new Date(request.needed_by).toLocaleDateString('fr-FR')}
                iconColor="#7c3aed"
                iconBg="rgba(124,58,237,0.08)"
              />
            </>
          )}
        </div>
      </div>

      {/* ══ MAIN CONTENT ════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: 2/3 ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Description */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--color-light-border)',
              }}
            >
              <CardHeader title="Description" />
              <div className="p-5">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-body-text)' }}>
                  {request.description || <span style={{ color: 'var(--color-muted-text)' }}>Aucune description fournie.</span>}
                </p>
              </div>
            </div>

            {/* Package Details */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--color-light-border)',
              }}
            >
              <CardHeader title="Détails du colis" />
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoBlock
                  icon={<Weight className="w-4 h-4" />}
                  label="Poids"
                  value={`${request.weight} kg`}
                />
                <InfoBlock
                  icon={<Ruler className="w-4 h-4" />}
                  label="Dimensions"
                  value={`${request.length} × ${request.width} × ${request.height} cm`}
                />
                <InfoBlock
                  icon={<Package className="w-4 h-4" />}
                  label="Type de colis"
                  value={request.package_type}
                />
                <InfoBlock
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Valeur déclarée"
                  value={formatCurrency(request.declared_value, request.currency_code)}
                />
              </div>
            </div>

            {/* Itinerary */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--color-light-border)',
              }}
            >
              <CardHeader title="Itinéraire" />
              <div className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Pickup */}
                  <div
                    className="flex-1 p-4 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(16,185,129,0.15)' }}
                      >
                        <MapPin className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                      </div>
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: '#059669' }}
                      >
                        Récupération
                      </p>
                    </div>
                    <p className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
                      {request.pickup_city?.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-body-text)' }}>
                      {request.pickup_country?.name}
                    </p>
                    {request.pickup_address && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted-text)' }}>
                        {request.pickup_address}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(249,115,22,0.1)' }}
                    >
                      <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-vibrant-orange)' }} />
                    </div>
                    <div
                      className="w-12 h-px"
                      style={{
                        background: 'linear-gradient(90deg, rgba(16,185,129,0.4), rgba(249,115,22,0.6))',
                      }}
                    />
                  </div>
                  <div className="sm:hidden flex items-center gap-2 pl-3">
                    <div
                      className="h-6 w-px"
                      style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.4), rgba(124,58,237,0.4))' }}
                    />
                  </div>

                  {/* Delivery */}
                  <div
                    className="flex-1 p-4 rounded-xl"
                    style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(124,58,237,0.15)' }}
                      >
                        <MapPin className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
                      </div>
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: '#7c3aed' }}
                      >
                        Livraison
                      </p>
                    </div>
                    <p className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
                      {request.delivery_city?.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-body-text)' }}>
                      {request.delivery_country?.name}
                    </p>
                    {request.delivery_address && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted-text)' }}>
                        {request.delivery_address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bids */}
            {request.bids && request.bids.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#fff',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                  border: '1px solid var(--color-light-border)',
                }}
              >
                <CardHeader title={`Soumissions (${request.bids.length})`} />
                <div className="p-5 space-y-4">
                  {request.bids.map((bid) => {
                    const bidStatusCfg =
                      bid.status === 'accepted'
                        ? { label: 'Acceptée', bg: 'rgba(16,185,129,0.1)', text: '#059669' }
                        : bid.status === 'pending'
                        ? { label: 'En attente', bg: 'rgba(234,179,8,0.1)', text: '#a16207' }
                        : { label: 'Rejetée', bg: 'rgba(239,68,68,0.1)', text: '#dc2626' };
                    return (
                      <div
                        key={bid.id}
                        className="p-4 rounded-xl"
                        style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid var(--color-light-border)' }}
                      >
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                              style={{ background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)' }}
                            >
                              {bid.traveler.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: 'var(--color-navy)' }}>
                                {bid.traveler.name}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <RatingStars rating={bid.traveler.rating || 0} size="sm" />
                                <span className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                                  {Number(bid.traveler.rating || 0).toFixed(1)} · {bid.traveler.completed_deliveries || 0} livraisons
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p
                              className="text-lg font-bold"
                              style={{ color: 'var(--color-royal-blue)', fontFamily: 'var(--font-heading)' }}
                            >
                              {formatCurrency(bid.proposed_price, bid.currency_code)}
                            </p>
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: bidStatusCfg.bg, color: bidStatusCfg.text }}
                            >
                              {bidStatusCfg.label}
                            </span>
                          </div>
                        </div>
                        {bid.message && (
                          <p className="text-sm mb-3" style={{ color: 'var(--color-body-text)' }}>
                            {bid.message}
                          </p>
                        )}
                        {bid.proposed_pickup_date && bid.proposed_delivery_date && (
                          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-muted-text)' }}>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              Récup. {new Date(bid.proposed_pickup_date).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              Livr. {new Date(bid.proposed_delivery_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trust & Safety */}
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
                <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                  Informations importantes
                </h2>
              </div>
              <ul className="space-y-3">
                {[
                  { icon: <FileText className="w-4 h-4" />, text: 'Assurez-vous que votre colis est correctement emballé et étiqueté avant la récupération.' },
                  { icon: <ShieldCheck className="w-4 h-4" />, text: 'Le paiement est sécurisé et conservé en séquestre jusqu\'à la confirmation de la livraison.' },
                  { icon: <Info className="w-4 h-4" />, text: 'Vérifiez que votre colis respecte les réglementations douanières des pays de départ et d\'arrivée.' },
                ].map(({ icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--color-royal-blue)' }}
                    >
                      {icon}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-body-text)' }}>{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Sender card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--color-light-border)',
              }}
            >
              <CardHeader title="Expéditeur" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {request.sender.avatar ? (
                      <img
                        src={request.sender.avatar}
                        alt={request.sender.name}
                        className="w-14 h-14 rounded-2xl object-cover"
                        style={{ border: '2px solid var(--color-light-border)' }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                        style={{ background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)' }}
                      >
                        {senderInitial}
                      </div>
                    )}
                    {request.sender.kyc_status === 'approved' && (
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-royal-blue)', border: '2px solid #fff' }}
                        aria-label="Identité vérifiée"
                      >
                        <ShieldCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                      {request.sender.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RatingStars rating={request.sender.rating || 0} size="sm" />
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
                        {Number(request.sender.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-text)' }}>
                      {request.sender.completed_deliveries || 0} expédition{(request.sender.completed_deliveries || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--color-light-border)',
              }}
            >
              <CardHeader title="Budget & Délais" />
              <div className="p-5 space-y-3">
                {request.max_budget > 0 && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--color-vibrant-orange)' }}
                    >
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#c2410c' }}>
                        Budget maximum
                      </p>
                      <p className="font-bold text-base" style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                        {formatCurrency(request.max_budget, request.currency_code)}
                      </p>
                    </div>
                  </div>
                )}
                {request.needed_by && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted-text)' }}>
                        Date limite
                      </p>
                      <p className="text-sm font-bold" style={{ color: 'var(--color-navy)' }}>
                        {new Date(request.needed_by).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--color-success-green)' }}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted-text)' }}>
                      Soumissions
                    </p>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-navy)' }}>
                      {bidCount} reçue{bidCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bid Form */}
            {canBid && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#fff',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                  border: '1px solid var(--color-light-border)',
                }}
              >
                <CardHeader title="Faire une soumission" />
                <div className="p-5">
                  <form onSubmit={handleSubmitBid} className="space-y-4">
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: 'var(--color-muted-text)' }}
                      >
                        Prix proposé ({request.currency_code})
                      </label>
                      <div className="relative">
                        <div
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-muted-text)' }}
                        >
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          style={{
                            border: '1.5px solid var(--color-light-border)',
                            color: 'var(--color-navy)',
                            background: 'rgba(248,250,252,0.8)',
                            outline: 'none',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-royal-blue)';
                            e.target.style.background = '#fff';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-light-border)';
                            e.target.style.background = 'rgba(248,250,252,0.8)';
                          }}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: 'var(--color-muted-text)' }}
                        >
                          Date de récupération
                        </label>
                        <input
                          type="date"
                          value={bidPickupDate}
                          onChange={(e) => setBidPickupDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          style={{
                            border: '1.5px solid var(--color-light-border)',
                            color: 'var(--color-navy)',
                            background: 'rgba(248,250,252,0.8)',
                            outline: 'none',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-royal-blue)';
                            e.target.style.background = '#fff';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-light-border)';
                            e.target.style.background = 'rgba(248,250,252,0.8)';
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: 'var(--color-muted-text)' }}
                        >
                          Date de livraison
                        </label>
                        <input
                          type="date"
                          value={bidDeliveryDate}
                          onChange={(e) => setBidDeliveryDate(e.target.value)}
                          min={bidPickupDate || new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          style={{
                            border: '1.5px solid var(--color-light-border)',
                            color: 'var(--color-navy)',
                            background: 'rgba(248,250,252,0.8)',
                            outline: 'none',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-royal-blue)';
                            e.target.style.background = '#fff';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-light-border)';
                            e.target.style.background = 'rgba(248,250,252,0.8)';
                          }}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: 'var(--color-muted-text)' }}
                      >
                        Message (optionnel)
                      </label>
                      <textarea
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm transition-colors resize-none"
                        style={{
                          border: '1.5px solid var(--color-light-border)',
                          color: 'var(--color-navy)',
                          background: 'rgba(248,250,252,0.8)',
                          outline: 'none',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--color-royal-blue)';
                          e.target.style.background = '#fff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-light-border)';
                          e.target.style.background = 'rgba(248,250,252,0.8)';
                        }}
                        rows={3}
                        placeholder="Présentez-vous et expliquez pourquoi vous êtes le bon choix..."
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submittingBid || !bidPrice || !bidPickupDate || !bidDeliveryDate}
                      loading={submittingBid}
                      className="w-full gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer la soumission
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Owner banner */}
            {isOwner && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.02) 100%)',
                  border: '1px solid rgba(37,99,235,0.2)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-royal-blue)' }} />
                  <p className="font-bold text-sm" style={{ color: 'var(--color-navy)' }}>
                    Votre annonce
                  </p>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-body-text)' }}>
                  Vous recevrez des notifications lorsque des voyageurs soumissionneront.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
