'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trip } from '@/lib/types/trip';
import { TripCard } from '@/components/ui/TripCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useDebounce } from '@/lib/hooks/useDebounce';

export default function TripSearchPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Filter state
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [travelerName, setTravelerName] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Debounced search values (300ms delay)
  const debouncedDepartureCity = useDebounce(departureCity, 300);
  const debouncedArrivalCity = useDebounce(arrivalCity, 300);
  const debouncedTravelerName = useDebounce(travelerName, 300);
  
  // Results state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'rating'>('date');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  // Auto-search when debounced values change (if user has started searching)
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [debouncedDepartureCity, debouncedArrivalCity, debouncedTravelerName, dateFrom, dateTo, minCapacity]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    setPage(1);

    try {
      const params = new URLSearchParams();
      if (debouncedDepartureCity) params.append('departure_city', debouncedDepartureCity);
      if (debouncedArrivalCity) params.append('arrival_city', debouncedArrivalCity);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (minCapacity) params.append('min_capacity', minCapacity);
      if (debouncedTravelerName) params.append('traveler_name', debouncedTravelerName);

      const response = await fetch(`/api/trips/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(t('errors.unauthorized'));
        }
        throw new Error(t('trips.searchError'));
      }

      const data = await response.json();
      // Handle both paginated and non-paginated responses
      const tripsData = data.data || data.trips || [];
      setTrips(tripsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.networkError'));
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedDepartureCity, debouncedArrivalCity, dateFrom, dateTo, minCapacity, debouncedTravelerName, t]);

  const handleClearFilters = () => {
    setDepartureCity('');
    setArrivalCity('');
    setDateFrom('');
    setDateTo('');
    setMinCapacity('');
    setTravelerName('');
    setTrips([]);
    setHasSearched(false);
    setError('');
  };

  const handleTripClick = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  // Sort trips
  const sortedTrips = [...trips].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.departure.date).getTime() - new Date(b.departure.date).getTime();
      case 'price':
        return a.pricePerKg - b.pricePerKg;
      case 'rating':
        return b.traveler.rating - a.traveler.rating;
      default:
        return 0;
    }
  });

  // Paginate trips
  const paginatedTrips = sortedTrips.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(sortedTrips.length / itemsPerPage);

  // Active filters
  const activeFilters = [
    departureCity && { label: `${t('trips.departure')}: ${departureCity}`, clear: () => setDepartureCity('') },
    arrivalCity && { label: `${t('trips.arrival')}: ${arrivalCity}`, clear: () => setArrivalCity('') },
    dateFrom && { label: `From: ${dateFrom}`, clear: () => setDateFrom('') },
    dateTo && { label: `To: ${dateTo}`, clear: () => setDateTo('') },
    minCapacity && { label: `Min ${minCapacity}kg`, clear: () => setMinCapacity('') },
    travelerName && { label: `${t('trips.traveler')}: ${travelerName}`, clear: () => setTravelerName('') },
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('trips.search')}
          </h1>
          <p className="text-gray-600">
            {t('howItWorksPage.sender.step1.description')}
          </p>
        </div>

        {/* Search Filters - Mobile Collapsible */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="md:hidden w-full flex items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
            aria-expanded={isFiltersOpen}
            aria-controls="filter-panel"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="font-semibold text-gray-900">
                {t('trips.filterResults')}
              </span>
              {activeFilters.length > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${
                isFiltersOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Filter Panel */}
          <div
            id="filter-panel"
            className={`p-6 ${isFiltersOpen ? 'block' : 'hidden md:block'}`}
          >
            <h2 className="hidden md:block text-lg font-semibold text-gray-900 mb-4">
              {t('trips.filterResults')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Input
                type="text"
                label={t('trips.departureCity')}
                value={departureCity}
                onChange={(e) => setDepartureCity(e.target.value)}
                placeholder={t('trips.departureCity')}
              />
              
              <Input
                type="text"
                label={t('trips.arrivalCity')}
                value={arrivalCity}
                onChange={(e) => setArrivalCity(e.target.value)}
                placeholder={t('trips.arrivalCity')}
              />
              
              <Input
                type="text"
                label={t('trips.travelerName')}
                value={travelerName}
                onChange={(e) => setTravelerName(e.target.value)}
                placeholder={t('trips.travelerNamePlaceholder')}
              />
              
              <Input
                type="number"
                label={t('trips.capacity')}
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                placeholder="Min kg"
              />
              
              <Input
                type="date"
                label={`${t('trips.departureDate')} (From)`}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              
              <Input
                type="date"
                label={`${t('trips.departureDate')} (To)`}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  handleSearch();
                  setIsFiltersOpen(false);
                }}
                disabled={loading}
                loading={loading}
                fullWidth
                className="sm:w-auto"
              >
                {t('common.search')}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={loading}
                fullWidth
                className="sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={filter.clear}
                    className="hover:text-blue-900"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    <svg
                      className="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sorting and Results Count */}
        {hasSearched && !loading && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <p className="text-gray-600">
              {sortedTrips.length} {sortedTrips.length === 1 ? 'trip' : 'trips'} found
            </p>
            
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-600">
                {t('trips.sortBy')}:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'rating')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">{t('trips.sortByDate')}</option>
                <option value="price">{t('trips.sortByPrice')}</option>
                <option value="rating">{t('trips.sortByRating')}</option>
              </select>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        )}

        {/* Empty State - No Search Yet */}
        {!hasSearched && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('trips.search')}
            </h3>
            <p className="text-gray-600">
              Use the filters above to find trips matching your needs
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {hasSearched && !loading && sortedTrips.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('trips.noTripsFound')}
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search criteria
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear all filters
            </Button>
          </div>
        )}

        {/* Results Grid */}
        {!loading && paginatedTrips.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded ${
                        page === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
