'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shipment } from '@/lib/types/api';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useDebounce } from '@/lib/hooks/useDebounce';
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
} from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-2.5 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

function ShipmentCard({ shipment, onClick }: { shipment: Shipment; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-900">{shipment.pickup_city}, {shipment.pickup_country}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-slate-900">{shipment.delivery_city}, {shipment.delivery_country}</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-orange-600" />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Weight className="w-4 h-4" />
          <span>{shipment.package_weight} kg</span>
        </div>
        <p className="text-sm text-slate-700 line-clamp-2">{shipment.package_description}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">{shipment.sender.name}</span>
        </div>
        <span className="text-lg font-bold text-orange-600">€{shipment.price?.toFixed(2) || '—'}</span>
      </div>
    </div>
  );
}

export default function ShipmentSearchPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [pickupCity, setPickupCity] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedPickup = useDebounce(pickupCity, 300);
  const debouncedDelivery = useDebounce(deliveryCity, 300);

  const [shipments, setShipments] = useState<Shipment[]>([]);
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

      const res = await fetch(`/api/shipments/available?${params}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(res.status === 401 ? 'Non autorisé' : 'Erreur de recherche');
      const data = await res.json();
      setShipments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [debouncedPickup, debouncedDelivery, maxWeight]);

  useEffect(() => { handleSearch(); }, []); // eslint-disable-line

  useEffect(() => {
    if (hasSearched) handleSearch();
  }, [debouncedPickup, debouncedDelivery, maxWeight]); // eslint-disable-line

  const handleClear = () => {
    setPickupCity(''); setDeliveryCity(''); setMaxWeight('');
    setShipments([]); setHasSearched(false); setError('');
  };

  const paginated = shipments.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(shipments.length / PER_PAGE);

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
              Trouvez des colis à transporter
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white mb-2"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              Chercher des colis
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Gagnez de l'argent en transportant des colis sur votre trajet
            </p>
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
                  placeholder="Ville de départ (ex: Paris)"
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
                  placeholder="Ville d'arrivée (ex: Abidjan)"
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
                Rechercher
              </Button>
            </div>

            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtres avancés
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
                      Poids max. (kg)
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
              <span className="font-bold text-slate-900">{shipments.length}</span>{' '}
              {shipments.length === 1 ? 'colis trouvé' : 'colis trouvés'}
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

        {hasSearched && !loading && shipments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-orange-50">
              <Package className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Aucun colis trouvé</h3>
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
              {paginated.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onClick={() => router.push(`/shipments/${shipment.id}`)}
                />
              ))}
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
