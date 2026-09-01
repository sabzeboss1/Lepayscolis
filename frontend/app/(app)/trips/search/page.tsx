'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trip } from '@/lib/types/trip';
import { TripCard } from '@/components/ui/TripCard';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { apiClient } from '@/lib/api/client';
import { useCurrencies } from '@/lib/hooks/useCurrencies';
import { DEFAULT_CURRENCY } from '@/lib/constants/currency';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plane,
  AlertCircle,
  Loader2,
  MapPin,
} from 'lucide-react';

/* ── Skeleton card ───────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-2.5 bg-slate-100 rounded w-1/4" />
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2 text-right">
          <div className="h-2.5 bg-slate-100 rounded w-1/3 ml-auto" />
          <div className="h-4 bg-slate-100 rounded w-2/3 ml-auto" />
          <div className="h-2.5 bg-slate-100 rounded w-1/4 ml-auto" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="h-6 bg-slate-100 rounded-lg w-20" />
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
        <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-2.5 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────── */
export default function TripSearchPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { convertToBase } = useCurrencies();

  /* filter state */
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity]     = useState('');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [minCapacity, setMinCapacity]     = useState('');
  const [travelerName, setTravelerName]   = useState('');
  const [showAdvanced, setShowAdvanced]   = useState(false);

  const debouncedDeparture  = useDebounce(departureCity, 300);
  const debouncedArrival    = useDebounce(arrivalCity, 300);
  const debouncedTraveler   = useDebounce(travelerName, 300);

  /* results state */
  const [trips, setTrips]           = useState<Trip[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy]         = useState<'date' | 'price' | 'rating'>('date');
  const [page, setPage]             = useState(1);
  const PER_PAGE = 9;

  /* search */
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (debouncedDeparture) params.append('departure', debouncedDeparture);
      if (debouncedArrival)   params.append('arrival', debouncedArrival);
      if (dateFrom)           params.append('dateFrom', dateFrom);
      if (dateTo)             params.append('dateTo', dateTo);
      if (minCapacity)        params.append('minCapacity', minCapacity);
      if (debouncedTraveler)  params.append('traveler_name', debouncedTraveler);

      const data = await apiClient.get<any>(`/api/trips?${params}`);
      setTrips(data.data || data.trips || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  }, [debouncedDeparture, debouncedArrival, dateFrom, dateTo, minCapacity, t]);

  /* initial load */
  useEffect(() => { handleSearch(); }, []); // eslint-disable-line

  /* auto-search when debounced values change */
  useEffect(() => {
    if (hasSearched) handleSearch();
  }, [debouncedDeparture, debouncedArrival, dateFrom, dateTo, minCapacity]); // eslint-disable-line

  const handleClear = () => {
    setDepartureCity(''); setArrivalCity('');
    setDateFrom(''); setDateTo('');
    setMinCapacity(''); setTravelerName('');
    setTrips([]); setHasSearched(false); setError('');
  };

  /* sort + paginate */
  const sorted = [...trips].sort((a, b) => {
    if (sortBy === 'date')   return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
    if (sortBy === 'price') {
      // Use converted prices if available, otherwise use original prices with conversion
      const priceA = a.price_per_kg_converted || convertToBase(a.price_per_kg, a.currency_code || DEFAULT_CURRENCY);
      const priceB = b.price_per_kg_converted || convertToBase(b.price_per_kg, b.currency_code || DEFAULT_CURRENCY);
      return priceA - priceB;
    }
    if (sortBy === 'rating') return (b.traveler?.rating || 0) - (a.traveler?.rating || 0);
    return 0;
  });
  const paginated   = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages  = Math.ceil(sorted.length / PER_PAGE);

  /* active filter chips */
  const chips = [
    departureCity && { label: `Départ : ${departureCity}`, clear: () => setDepartureCity('') },
    arrivalCity   && { label: `Arrivée : ${arrivalCity}`,  clear: () => setArrivalCity('') },
    dateFrom      && { label: `Depuis le ${dateFrom}`,      clear: () => setDateFrom('') },
    dateTo        && { label: `Jusqu'au ${dateTo}`,         clear: () => setDateTo('') },
    minCapacity   && { label: `≥ ${minCapacity} kg`,        clear: () => setMinCapacity('') },
    travelerName  && { label: `Voyageur : ${travelerName}`, clear: () => setTravelerName('') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  /* pagination helper */
  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [1, '…', page-1, page, page+1, '…', totalPages];
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-soft-gray)' }}>

      {/* ── Hero search header ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a8a 60%, #1d4ed8 100%)',
        }}
      >
        {/* decorative blobs */}
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-10 animate-blob"
          style={{ background: 'var(--color-vibrant-orange)' }} />
        <div className="absolute bottom-[-40px] left-[10%] w-48 h-48 rounded-full opacity-5 animate-blob animation-delay-2000"
          style={{ background: 'var(--color-ocean-blue)' }} />

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
              <Plane className="w-3.5 h-3.5" />
              {t('dashboard.findRightProfile') || 'Trouvez le bon voyageur'}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white mb-2"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              {t('dashboard.searchTraveler') || 'Chercher un voyageur'}
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              {t('home.hero.subtitle') || 'Connectez-vous avec des voyageurs de confiance qui partent vers votre destination'}
            </p>
          </div>

          {/* Main search bar */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Primary row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  placeholder={t('trips.departureCity') || 'Ville de départ (ex: Paris)'}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    caretColor: '#fff',
                  }}
                  onFocus={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                />
              </div>

              <div
                className="hidden sm:flex items-center justify-center w-8 h-12 shrink-0"
                aria-hidden="true"
              >
                <Plane className="w-4 h-4 rotate-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>

              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  value={arrivalCity}
                  onChange={(e) => setArrivalCity(e.target.value)}
                  placeholder={t('trips.arrivalCity') || 'Ville d\'arrivée (ex: Abidjan)'}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    caretColor: '#fff',
                  }}
                  onFocus={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  onBlur={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                />
              </div>

              <Button
                onClick={() => { handleSearch(); }}
                disabled={loading}
                loading={loading}
                className="!rounded-xl !font-semibold shrink-0 sm:w-auto"
                style={{
                  background: 'var(--color-vibrant-orange)',
                  boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                {t('common.search') || 'Rechercher'}
              </Button>
            </div>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('trips.filterResults') || 'Filtres avancés'}
              {chips.length > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--color-vibrant-orange)', color: '#fff' }}
                >
                  {chips.length}
                </span>
              )}
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform"
                style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {/* Advanced filter fields */}
            {showAdvanced && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: t('trips.availableCapacity') || 'Capacité min. (kg)',
                      value: minCapacity,
                      onChange: setMinCapacity,
                      placeholder: 'Ex: 5',
                      type: 'number',
                    },
                  ].map(({ label, value, onChange, placeholder, type }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {label}
                      </label>
                      <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#fff',
                          caretColor: '#fff',
                        }}
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t('trips.departureDate') || 'Départ', value: dateFrom, onChange: setDateFrom },
                      { label: t('trips.arrivalDate') || 'Arrivée', value: dateTo, onChange: setDateTo },
                    ].map(({ label, value, onChange }) => (
                      <div key={label}>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {label}
                        </label>
                        <input
                          type="date"
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: value ? '#fff' : 'rgba(255,255,255,0.35)',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Results area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Active chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs font-medium text-muted-text">{t('common.activeFilters') || 'Filtres actifs :'}</span>
            {chips.map(({ label, clear }, i) => (
              <button
                key={i}
                onClick={clear}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: 'rgba(37,99,235,0.08)',
                  color: 'var(--color-royal-blue)',
                  border: '1px solid rgba(37,99,235,0.2)',
                }}
              >
                {label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={handleClear}
              className="text-xs text-muted-text underline hover:text-navy transition-colors ml-1"
            >
              {t('common.clearAll') || 'Tout effacer'}
            </button>
          </div>
        )}

        {/* Sort bar + count */}
        {hasSearched && !loading && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <p className="text-sm font-medium text-body-text">
              <span className="font-bold text-navy">{sorted.length}</span>{' '}
              {sorted.length === 1 ? (t('trips.travelerFound') || 'voyageur trouvé') : (t('trips.travelersFound') || 'voyageurs trouvés')}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-medium text-muted-text whitespace-nowrap">
                {t('trips.sortBy') || 'Trier par :'}
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'rating')}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2"
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    color: 'var(--color-navy)',
                  }}
                >
                  <option value="date">{t('trips.sortByDate') || 'Date de départ'}</option>
                  <option value="price">{t('trips.sortByPrice') || 'Prix / kg'}</option>
                  <option value="rating">{t('trips.sortByRating') || 'Note'}</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-sm"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#b91c1c',
            }}
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty — no search yet (shouldn't happen since we load on mount) */}
        {!hasSearched && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(37,99,235,0.08)' }}
            >
              <Search className="w-7 h-7" style={{ color: 'var(--color-royal-blue)' }} />
            </div>
            <h3 className="text-base font-semibold text-navy mb-1">Lancez une recherche</h3>
            <p className="text-sm text-muted-text max-w-xs">
              Utilisez les filtres ci-dessus pour trouver un voyageur adapté à vos besoins
            </p>
          </div>
        )}

        {/* Empty — no results */}
        {hasSearched && !loading && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(249,115,22,0.08)' }}
            >
              <Plane className="w-7 h-7" style={{ color: 'var(--color-vibrant-orange)' }} />
            </div>
            <h3 className="text-base font-semibold text-navy mb-1">Aucun voyageur trouvé</h3>
            <p className="text-sm text-muted-text max-w-xs mb-5">
              Essayez d'ajuster vos critères de recherche ou revenez plus tard
            </p>
            <Button variant="outline" size="sm" onClick={handleClear} className="!rounded-xl">
              Effacer les filtres
            </Button>
          </div>
        )}

        {/* Results grid */}
        {!loading && paginated.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
              {paginated.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => router.push(`/trips/${trip.id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#fff', borderColor: '#e2e8f0', color: 'var(--color-navy)' }}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNums().map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-muted-text">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold border transition-colors"
                      style={
                        page === n
                          ? {
                              background: 'var(--color-royal-blue)',
                              borderColor: 'var(--color-royal-blue)',
                              color: '#fff',
                            }
                          : {
                              background: '#fff',
                              borderColor: '#e2e8f0',
                              color: 'var(--color-navy)',
                            }
                      }
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#fff', borderColor: '#e2e8f0', color: 'var(--color-navy)' }}
                  aria-label="Page suivante"
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
