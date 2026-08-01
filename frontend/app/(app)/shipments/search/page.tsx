'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shipment } from '@/lib/types/api';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import { useCurrencyFormatter } from '@/lib/hooks/useCurrencyFormatter';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  MapPin,
  Weight,
  User,
  Clock,
  DollarSign,
  Users,
  Megaphone,
} from 'lucide-react';

interface ShipmentRequest {
  id: string;
  title: string;
  description: string;
  weight: number;
  max_budget: number;
  currency_code: string;
  
  // Currency conversion fields
  max_budget_converted?: number;
  max_budget_formatted?: string;
  max_budget_original: number;
  max_budget_original_currency: string;
  
  status: string;
  pickup_country: { id: number; name_en: string; name_fr: string; name?: string };
  pickup_city: { id: number; name_en: string; name_fr: string; name?: string };
  delivery_country: { id: number; name_en: string; name_fr: string; name?: string };
  delivery_city: { id: number; name_en: string; name_fr: string; name?: string };
  needed_by: string | null;
  created_at: string;
  bids_count?: number;
  sender: { name: string; avatar?: string };
}

function SkeletonCard() {
  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden animate-pulse"
      style={{ border: '1px solid var(--color-light-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      {/* accent bar */}
      <div className="h-0.5 bg-slate-100" />
      <div className="p-5 space-y-4">
        {/* badge + status row */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-slate-100 rounded-full" />
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
        </div>
        {/* title */}
        <div className="space-y-1.5">
          <div className="h-5 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
        {/* route */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-8 bg-slate-100 rounded-xl" />
          <div className="w-6 h-6 bg-slate-100 rounded-full shrink-0" />
          <div className="flex-1 h-8 bg-slate-100 rounded-xl" />
        </div>
        {/* description */}
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-5/6" />
        </div>
        {/* footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
          <div className="h-6 w-24 bg-slate-100 rounded-full" />
          <div className="h-6 w-20 bg-slate-100 rounded-full ml-auto" />
        </div>
      </div>
    </div>
  );
}

function ShipmentRequestCard({ request, onClick }: { request: ShipmentRequest; onClick: () => void }) {
  const { formatWithCurrencyNote, isHydrated } = useCurrencyFormatter();
  const senderInitial = request.sender.name.charAt(0).toUpperCase();

  // Use converted budget if available and hydrated, otherwise use original budget
  const displayBudget = (isHydrated && (request as any).max_budget_converted) ?? request.max_budget;
  const displayCurrency = (isHydrated && (request as any).max_budget_converted) ? 
    ((request as any).max_budget_formatted ? (request as any).max_budget_formatted.split(' ')[1] : '') : 
    request.currency_code;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="relative bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        border: '1px solid var(--color-light-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
    >
      {/* Top gradient accent */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
        aria-hidden="true"
      />

      <div className="p-5">
        {/* ── Header row: badge + status ── */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
            style={{ background: 'rgba(249,115,22,0.1)', color: '#c2410c' }}
          >
            <Megaphone className="w-3 h-3" />
            Annonce
          </span>
          <div className="flex items-center gap-2">
            {request.bids_count !== undefined && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium"
                style={{ color: 'var(--color-muted-text)' }}
              >
                <Users className="w-3 h-3" />
                {request.bids_count} soumission{request.bids_count !== 1 ? 's' : ''}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Ouverte
            </span>
          </div>
        </div>

        {/* ── Title ── */}
        <h3
          className="text-base font-bold mb-3 transition-colors line-clamp-2"
          style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)', lineHeight: 1.3 }}
        >
          <span className="group-hover:underline decoration-orange-500 underline-offset-2">
            {request.title}
          </span>
        </h3>

        {/* ── Route ── */}
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-3"
          style={{ background: 'var(--color-soft-gray)', border: '1px solid var(--color-light-border)' }}
        >
          {/* Pickup */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate"
              style={{ color: 'var(--color-muted-text)' }}
            >
              {request.pickup_country?.name || request.pickup_country?.name_fr || '—'}
            </p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-navy)' }}>
              {request.pickup_city?.name || request.pickup_city?.name_fr || '—'}
            </p>
          </div>

          {/* Arrow */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)' }}
            >
              <Package className="w-3 h-3" style={{ color: 'var(--color-vibrant-orange)' }} />
            </div>
            <div
              className="w-8 h-px"
              style={{ background: 'linear-gradient(90deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
            />
          </div>

          {/* Delivery */}
          <div className="flex-1 min-w-0 text-right">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate"
              style={{ color: 'var(--color-muted-text)' }}
            >
              {request.delivery_country?.name || request.delivery_country?.name_fr || '—'}
            </p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-navy)' }}>
              {request.delivery_city?.name || request.delivery_city?.name_fr || '—'}
            </p>
          </div>
        </div>

        {/* ── Description ── */}
        {request.description && (
          <p
            className="text-xs leading-relaxed line-clamp-2 mb-4"
            style={{ color: 'var(--color-body-text)' }}
          >
            {request.description}
          </p>
        )}

        {/* ── Footer pills + sender ── */}
        <div
          className="flex items-center flex-wrap gap-2 pt-3"
          style={{ borderTop: '1px solid var(--color-light-border)' }}
        >
          {/* Weight */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--color-royal-blue)' }}
          >
            <Package className="w-3 h-3" />
            {request.weight} kg
          </span>

          {/* Budget */}
          {request.max_budget > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--color-vibrant-orange)' }}
              suppressHydrationWarning
            >
              <DollarSign className="w-3 h-3" />
              Max {(isHydrated && (request as any).max_budget_formatted) || formatWithCurrencyNote(displayBudget, displayCurrency)}
            </span>
          )}

          {/* Deadline */}
          {request.needed_by && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(148,163,184,0.12)', color: 'var(--color-body-text)' }}
            >
              <Clock className="w-3 h-3" />
              {new Date(request.needed_by).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}

          {/* Sender */}
          <div className="ml-auto flex items-center gap-1.5">
            {request.sender.avatar ? (
              <img
                src={request.sender.avatar}
                alt={request.sender.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)' }}
              >
                {senderInitial}
              </div>
            )}
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-muted-text)' }}>
              {request.sender.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShipmentCard({ shipment, onClick }: { shipment: Shipment; onClick: () => void }) {
  const { formatWithCurrencyNote, isHydrated } = useCurrencyFormatter();
  const senderInitial = shipment.sender?.name?.charAt(0).toUpperCase() || 'U';

  // Use converted price if available and hydrated, otherwise use original price
  const displayPrice = (isHydrated && (shipment as any).price_converted) ?? shipment.price;
  const displayCurrency = (isHydrated && (shipment as any).price_converted) ? 
    ((shipment as any).price_formatted ? (shipment as any).price_formatted.split(' ')[1] : '') : 
    (shipment as any).currency_code;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="relative bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        border: '1px solid var(--color-light-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
    >
      {/* Top gradient accent */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
        aria-hidden="true"
      />

      <div className="p-5">
        {/* ── Header row: badge + status ── */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
            style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--color-royal-blue)' }}
          >
            <Package className="w-3 h-3" />
            Expédition
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Disponible
          </span>
        </div>

        {/* ── Route ── */}
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-3"
          style={{ background: 'var(--color-soft-gray)', border: '1px solid var(--color-light-border)' }}
        >
          {/* Pickup */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate"
              style={{ color: 'var(--color-muted-text)' }}
            >
              {shipment.pickup_country || '—'}
            </p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-navy)' }}>
              {shipment.pickup_city || '—'}
            </p>
          </div>

          {/* Arrow */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.1)' }}
            >
              <Package className="w-3 h-3" style={{ color: 'var(--color-royal-blue)' }} />
            </div>
            <div
              className="w-8 h-px"
              style={{ background: 'linear-gradient(90deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
            />
          </div>

          {/* Delivery */}
          <div className="flex-1 min-w-0 text-right">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate"
              style={{ color: 'var(--color-muted-text)' }}
            >
              {shipment.delivery_country || '—'}
            </p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-navy)' }}>
              {shipment.delivery_city || '—'}
            </p>
          </div>
        </div>

        {/* ── Description ── */}
        {shipment.package_description && (
          <p
            className="text-xs leading-relaxed line-clamp-2 mb-4"
            style={{ color: 'var(--color-body-text)' }}
          >
            {shipment.package_description}
          </p>
        )}

        {/* ── Footer pills + price ── */}
        <div
          className="flex items-center flex-wrap gap-2 pt-3"
          style={{ borderTop: '1px solid var(--color-light-border)' }}
        >
          {/* Weight */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--color-royal-blue)' }}
          >
            <Weight className="w-3 h-3" />
            {shipment.package_weight} kg
          </span>

          {/* Sender */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)' }}
            >
              {senderInitial}
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-muted-text)' }}>
              {shipment.sender?.name || 'Utilisateur'}
            </span>
          </div>

          {/* Price */}
          {shipment.price > 0 && (
            <span
              className="ml-auto text-sm font-bold"
              style={{ color: 'var(--color-vibrant-orange)', fontFamily: 'var(--font-heading)' }}
              suppressHydrationWarning
            >
              {(isHydrated && (shipment as any).price_formatted) || formatWithCurrencyNote(displayPrice, displayCurrency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShipmentSearchPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'shipments' | 'requests'>('requests'); // Par défaut sur les annonces
  const [pickupCity, setPickupCity] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedPickup = useDebounce(pickupCity, 300);
  const debouncedDelivery = useDebounce(deliveryCity, 300);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (debouncedPickup) params.append('pickup_city', debouncedPickup);
      if (debouncedDelivery) params.append('delivery_city', debouncedDelivery);
      if (maxWeight) params.append('max_weight', maxWeight);

      // Get auth token for currency conversion
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (activeTab === 'shipments') {
        const res = await fetch(`/api/shipments/available?${params}`, {
          headers,
          credentials: 'include',
        });
        if (!res.ok) throw new Error(res.status === 401 ? 'Non autorisé' : 'Erreur de recherche');
        const data = await res.json();
        setShipments(data.data || []);
      } else {
        const res = await fetch(`/api/shipment-requests?${params}`, {
          headers,
          credentials: 'include',
        });
        if (!res.ok) throw new Error(res.status === 401 ? 'Non autorisé' : 'Erreur de recherche');
        const data = await res.json();
        setShipmentRequests(data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [debouncedPickup, debouncedDelivery, maxWeight, activeTab]);

  useEffect(() => { handleSearch(); }, []); // eslint-disable-line

  useEffect(() => {
    if (hasSearched) handleSearch();
  }, [debouncedPickup, debouncedDelivery, maxWeight, activeTab]); // eslint-disable-line

  const handleClear = () => {
    setPickupCity(''); setDeliveryCity(''); setMaxWeight('');
    setShipments([]); setShipmentRequests([]); setHasSearched(false); setError('');
  };

  const currentData = activeTab === 'shipments' ? shipments : shipmentRequests;
  const paginated = currentData.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(currentData.length / PER_PAGE);

  const chips = [
    pickupCity && { label: `Départ : ${pickupCity}`, clear: () => setPickupCity('') },
    deliveryCity && { label: `Arrivée : ${deliveryCity}`, clear: () => setDeliveryCity('') },
    maxWeight && { label: `≤ ${maxWeight} kg`, clear: () => setMaxWeight('') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [1, '…', page-1, page, page+1, '…', totalPages];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a8a 60%, #1d4ed8 100%)',
        }}
      >
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-10 animate-blob"
          style={{ background: 'var(--color-vibrant-orange)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="mb-7 text-center">
            <p
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
              style={{
                background: 'rgba(249,115,22,0.15)',
                color: '#fdba74',
                border: '1px solid rgba(249,115,22,0.25)',
              }}
            >
              <Package className="w-3.5 h-3.5" />
              {t('dashboard.findDeliveries') || 'Trouvez des colis à transporter'}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white mb-2"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              {t('dashboard.searchShipments') || 'Chercher des colis'}
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              {t('home.roles.traveler.description') || 'Gagnez de l\'argent en transportant des colis sur votre trajet'}
            </p>
          </div>

          {/* Onglets */}
          <div className="flex items-center gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'requests'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              {t('shipments.requestsTab') || 'Annonces d\'expédition'}
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'shipments'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              <Package className="w-4 h-4" />
              {t('shipments.directTab') || 'Expéditions directes'}
            </button>
          </div>

          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  placeholder={t('trips.departureCity') || 'Ville de départ (ex: Paris)'}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    caretColor: '#fff',
                  }}
                />
              </div>

              <div className="hidden sm:flex items-center justify-center w-8 h-12 shrink-0">
                <Package className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>

              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder={t('trips.arrivalCity') || 'Ville d\'arrivée (ex: Abidjan)'}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    caretColor: '#fff',
                  }}
                />
              </div>

              <Button
                onClick={handleSearch}
                disabled={loading}
                loading={loading}
                className="!rounded-xl !font-semibold shrink-0"
                style={{
                  background: 'var(--color-vibrant-orange)',
                  boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                  color: '#fff',
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                {t('common.search') || 'Rechercher'}
              </Button>
            </div>

            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('trips.filterResults') || 'Filtres avancés'}
              {chips.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--color-vibrant-orange)', color: '#fff' }}>
                  {chips.length}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 transition-transform"
                style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }} />
            </button>

            {showAdvanced && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {t('shipments.maxWeight') || 'Poids max. (kg)'}
                    </label>
                    <input
                      type="number"
                      value={maxWeight}
                      onChange={(e) => setMaxWeight(e.target.value)}
                      placeholder="Ex: 10"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs font-medium text-slate-500">Filtres actifs :</span>
            {chips.map(({ label, clear }, i) => (
              <button
                key={i}
                onClick={clear}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors bg-blue-50 text-blue-700 border border-blue-200"
              >
                {label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={handleClear} className="text-xs text-slate-500 underline hover:text-slate-900 ml-1">
              Tout effacer
            </button>
          </div>
        )}

        {hasSearched && !loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-medium text-slate-700">
              <span className="font-bold text-slate-900">{currentData.length}</span>{' '}
              {activeTab === 'requests' 
                ? (currentData.length === 1 ? 'annonce trouvée' : 'annonces trouvées')
                : (currentData.length === 1 ? 'colis trouvé' : 'colis trouvés')
              }
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-sm bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {hasSearched && !loading && currentData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              activeTab === 'requests' ? 'bg-orange-50' : 'bg-blue-50'
            }`}>
              {activeTab === 'requests' ? (
                <Megaphone className="w-7 h-7 text-orange-600" />
              ) : (
                <Package className="w-7 h-7 text-blue-600" />
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {activeTab === 'requests' ? 'Aucune annonce trouvée' : 'Aucun colis trouvé'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mb-5">
              Essayez d'ajuster vos critères ou revenez plus tard
            </p>
            <Button variant="outline" size="sm" onClick={handleClear} className="!rounded-xl">
              Effacer les filtres
            </Button>
          </div>
        )}

        {!loading && paginated.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
              {activeTab === 'requests' 
                ? (paginated as ShipmentRequest[]).map((request) => (
                    <ShipmentRequestCard
                      key={request.id}
                      request={request}
                      onClick={() => router.push(`/shipment-requests/${request.id}`)}
                    />
                  ))
                : (paginated as Shipment[]).map((shipment) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onClick={() => router.push(`/shipments/${shipment.id}`)}
                    />
                  ))
              }
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 bg-white border-slate-200 text-slate-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNums().map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-500">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold border transition-colors"
                      style={
                        page === n
                          ? { background: 'var(--color-royal-blue)', borderColor: 'var(--color-royal-blue)', color: '#fff' }
                          : { background: '#fff', borderColor: '#e2e8f0', color: 'var(--color-navy)' }
                      }
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 bg-white border-slate-200 text-slate-900"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}