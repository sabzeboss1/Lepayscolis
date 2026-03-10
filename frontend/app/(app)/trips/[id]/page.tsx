'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trip } from '@/lib/types/trip';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useRealtimeTripStatus } from '@/lib/hooks/useRealtimeStatusUpdates';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const tripId = params.id as string;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time status updates
  useRealtimeTripStatus(tripId, (data) => {
    if (trip && data.id === tripId) {
      setTrip({ ...trip, status: data.status as any });
    }
  });

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError(t('errors.notFound'));
          } else if (response.status === 401) {
            setError(t('errors.unauthorized'));
          } else {
            setError(t('errors.serverError'));
          }
          return;
        }

        const data = await response.json();
        // Handle both wrapped and unwrapped responses
        setTrip(data.data || data.trip || data);
      } catch (err) {
        setError(t('errors.networkError'));
        console.error('Fetch trip error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTrip();
    }
  }, [tripId, t]);

  const handleContactTraveler = () => {
    if (trip) {
      router.push(`/messages?userId=${trip.travelerId}`);
    }
  };

  const handleRequestShipment = () => {
    if (trip) {
      router.push(`/shipments/new?tripId=${trip.id}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (departure: Date, arrival: Date) => {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours}h` : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">{t('common.error')}</h2>
            <p>{error || t('errors.notFound')}</p>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              {t('common.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back')}
        </button>

        {/* Trip Header */}
        <Card className="mb-6" padding="lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {trip.departure.city} → {trip.arrival.city}
              </h1>
              <p className="text-gray-600">
                {trip.departure.country} to {trip.arrival.country}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-500">
                ${trip.pricePerKg.toFixed(2)}/kg
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {trip.availableCapacity} kg available
              </p>
            </div>
          </div>

          {/* Route Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-t border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                {t('trips.departure')}
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {trip.departure.city}, {trip.departure.country}
              </p>
              <p className="text-gray-600 mt-1">{formatDate(trip.departure.date)}</p>
              <p className="text-sm text-gray-500">{formatTime(trip.departure.date)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                {t('trips.arrival')}
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {trip.arrival.city}, {trip.arrival.country}
              </p>
              <p className="text-gray-600 mt-1">{formatDate(trip.arrival.date)}</p>
              <p className="text-sm text-gray-500">{formatTime(trip.arrival.date)}</p>
            </div>
          </div>

          {/* Trip Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">
                  {calculateDuration(trip.departure.date, trip.arrival.date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('trips.capacity')}</p>
                <p className="font-semibold text-gray-900">{trip.availableCapacity} kg</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('trips.status')}</p>
                <p className="font-semibold text-gray-900 capitalize">{trip.status}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Traveler Profile */}
        <Card className="mb-6" padding="lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('trips.travelerInfo')}
          </h2>
          
          <div className="flex items-start gap-4">
            <img
              src={trip.traveler.avatar || '/default-avatar.png'}
              alt={`${trip.traveler.name}'s avatar`}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {trip.traveler.name}
                </h3>
                
                {trip.traveler.isRecommended && (
                  <span
                    className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded"
                    title={t('profile.recommended')}
                  >
                    <svg
                      className="w-3 h-3 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t('profile.recommended')}
                  </span>
                )}
                
                {trip.traveler.kycStatus === 'approved' && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-label={t('profile.verified')}
                  >
                    <title>{t('profile.verified')}</title>
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <RatingStars rating={trip.traveler.rating} size="sm" />
                  <span className="text-sm font-medium text-gray-700 ml-1">
                    {trip.traveler.rating.toFixed(1)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {trip.traveler.completedDeliveries} {t('profile.completedDeliveries')}
                </div>
              </div>

              {/* Preuve de voyage */}
              {trip.travelProofUrl && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <svg
                    className="w-5 h-5 text-green-500"
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
                  <span className="text-gray-700 font-medium">Preuve de voyage vérifiée</span>
                  <a
                    href={trip.travelProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Voir le document
                  </a>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleContactTraveler}
                  size="sm"
                >
                  {t('trips.contactTraveler')}
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={handleRequestShipment}
                  size="sm"
                >
                  {t('trips.requestShipment')}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Important Information
          </h2>
          
          <div className="space-y-3 text-gray-600">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              <p>
                Contact the traveler to discuss package details and delivery arrangements.
              </p>
            </div>
            
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              <p>
                Payment is held securely in escrow until delivery is confirmed.
              </p>
            </div>
            
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              <p>
                Ensure your package complies with customs regulations in both countries.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
