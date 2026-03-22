'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Trip } from '@/lib/types/trip';

type TripStatus = 'all' | 'active' | 'completed' | 'cancelled';
type SortOption = 'date' | 'price' | 'capacity';

export default function MyTripsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TripStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  useEffect(() => {
    fetchMyTrips();
  }, []);

  const fetchMyTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trips/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(t('errors.unauthorized'));
        }
        throw new Error(t('trips.fetchError'));
      }

      const data = await response.json();
      // Handle both paginated and non-paginated responses
      const tripsData = data.data || data.trips || [];
      setTrips(tripsData);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setError(err instanceof Error ? err.message : t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm(t('trips.confirmCancel') + '?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('trips.cancelError'));
      }

      // Refresh trips list
      fetchMyTrips();
    } catch (err) {
      console.error('Failed to cancel trip:', err);
      alert(err instanceof Error ? err.message : t('trips.cancelError'));
    }
  };

  const handleEditTrip = (tripId: string) => {
    router.push(`/trips/edit/${tripId}`);
  };

  const getFilteredAndSortedTrips = () => {
    let filtered = trips;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.departure_date).getTime() - new Date(a.departure_date).getTime();
        case 'price':
          return b.price_per_kg - a.price_per_kg;
        case 'capacity':
          return b.available_capacity - a.available_capacity;
        default:
          return 0;
      }
    });

    return sorted;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const filteredTrips = getFilteredAndSortedTrips();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('trips.myTrips')}</h1>
        <Button
          variant="primary"
          onClick={() => router.push('/trips/new')}
        >
          {t('trips.publish')}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('trips.filterResults')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'completed', 'cancelled'] as TripStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? t('common.all') : t(`trips.${status}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('trips.sortBy')}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">{t('trips.sortByDate')}</option>
            <option value="price">{t('trips.sortByPrice')}</option>
            <option value="capacity">{t('trips.capacity')}</option>
          </select>
        </div>
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">
            {statusFilter === 'all' 
              ? t('dashboard.noActiveTrips')
              : t('trips.noTripsFound')
            }
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/trips/new')}
          >
            {t('trips.publish')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold">
                      {trip.departure_city} → {trip.arrival_city}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                        trip.status
                      )}`}
                    >
                      {t(`trips.${trip.status}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium text-gray-900">{t('trips.departure')}</p>
                      <p>{trip.departure_city}, {trip.departure_country}</p>
                      <p>{formatDate(trip.departure_date)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t('trips.arrival')}</p>
                      <p>{trip.arrival_city}, {trip.arrival_country}</p>
                      <p>{formatDate(trip.arrival_date)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-6 text-sm">
                    <div>
                      <span className="font-medium">{t('trips.capacity')}:</span>{' '}
                      <span className="text-gray-700">{trip.available_capacity} kg</span>
                    </div>
                    <div>
                      <span className="font-medium">{t('trips.pricePerKg')}:</span>{' '}
                      <span className="text-gray-700">${trip.price_per_kg}</span>
                    </div>
                    {trip.travel_proof_url && (
                      <div className="flex items-center gap-1 text-green-600">
                        <svg
                          className="w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">Preuve de voyage</span>
                      </div>
                    )}
                  </div>
                </div>

                {trip.status === 'active' && (
                  <div className="flex flex-col gap-2 md:w-32">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTrip(trip.id)}
                      fullWidth
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelTrip(trip.id)}
                      fullWidth
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
