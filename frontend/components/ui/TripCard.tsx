import React from 'react';
import { Trip } from '@/lib/types/trip';
import { Card } from './Card';
import { RatingStars } from './RatingStars';

export interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
  className?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onClick,
  className = '',
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`${className} touch-manipulation active:scale-[0.98] transition-transform`}
      padding="lg"
    >
      <div className="space-y-4">
        {/* Route visualization */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{trip.departure_country}</p>
            <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{trip.departure_city}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDate(trip.departure_date)}</p>
          </div>

          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>

          <div className="flex-1 text-right min-w-0">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{trip.arrival_country}</p>
            <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{trip.arrival_city}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDate(trip.arrival_date)}</p>
          </div>
        </div>

        {/* Capacity and price */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="text-xs sm:text-sm text-gray-600">
              {trip.available_capacity} kg available
            </span>
            {trip.travel_proof_url && (
              <svg
                className="w-4 h-4 text-green-500 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-label="Preuve de voyage vérifiée"
              >
                <title>Preuve de voyage vérifiée</title>
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          <div className="text-right">
            <p className="text-base sm:text-lg font-bold text-orange-500">
              ${trip.price_per_kg.toFixed(2)}/kg
            </p>
          </div>
        </div>

        {/* Traveler info */}
        {trip.traveler && (
          <div className="flex items-center gap-2 sm:gap-3 pt-3 border-t border-gray-200">
            <img
              src={trip.traveler.avatar || '/default-avatar.png'}
              alt={`${trip.traveler.name}'s avatar`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                  {trip.traveler.name}
                </p>
                {trip.traveler.is_recommended && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded flex-shrink-0"
                    title="Recommended"
                    aria-label="Recommended traveler"
                  >
                    <svg
                      className="w-3 h-3"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                {trip.traveler.kyc_status === 'approved' && (
                  <svg
                    className="w-4 h-4 text-blue-500 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-label="KYC Verified"
                  >
                    <title>KYC Verified</title>
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <RatingStars rating={trip.traveler.rating} size="sm" />
                <span className="text-xs text-gray-500 ml-1">
                  ({trip.traveler.completed_deliveries})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
