'use client';

import React from 'react';
import { Trip } from '@/lib/types/trip';
import { RatingStars } from './RatingStars';
import { CurrencyDisplay } from './CurrencyDisplay';
import {
  Plane,
  Package,
  ShieldCheck,
  Star,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';

export interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
  className?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''
      } ${className}`}
      style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: 'linear-gradient(90deg, var(--color-royal-blue), var(--color-vibrant-orange))',
        }}
      />

      <div className="p-5 pt-6 space-y-4">
        {/* ── Route ── */}
        <div className="flex items-center gap-3">
          {/* Departure */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
              {trip.departure_country}
            </p>
            <p className="text-base font-bold text-navy truncate">{trip.departure_city}</p>
            <div className="flex items-center gap-1 mt-1">
              <CalendarDays className="w-3 h-3 text-muted-text shrink-0" />
              <p className="text-xs text-muted-text">{formatDate(trip.departure_date)}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.08)' }}
            >
              <Plane
                className="w-4 h-4"
                style={{ color: 'var(--color-royal-blue)' }}
              />
            </div>
            <div
              className="w-12 h-px"
              style={{
                background: 'linear-gradient(90deg, var(--color-royal-blue), var(--color-vibrant-orange))',
              }}
            />
          </div>

          {/* Arrival */}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-text mb-0.5">
              {trip.arrival_country}
            </p>
            <p className="text-base font-bold text-navy truncate">{trip.arrival_city}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <CalendarDays className="w-3 h-3 text-muted-text shrink-0" />
              <p className="text-xs text-muted-text">{formatDate(trip.arrival_date)}</p>
            </div>
          </div>
        </div>

        {/* ── Capacity + Price ── */}
        <div
          className="flex items-center justify-between gap-3 pt-3"
          style={{ borderTop: '1px solid #f1f5f9' }}
        >
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-muted-text shrink-0" />
            <span className="text-xs font-medium text-body-text">
              {trip.available_capacity} kg dispo
            </span>
            {trip.travel_proof_url && (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#10b981' }} />
            )}
          </div>

          <div
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold"
            style={{
              background: 'rgba(249,115,22,0.1)',
              color: 'var(--color-vibrant-orange)',
            }}
          >
            <CurrencyDisplay 
              amount={trip.price_per_kg_converted || trip.price_per_kg} 
              currency={trip.price_per_kg_original_currency ? undefined : trip.currency_code}
              showCurrencyNote={!!trip.price_per_kg_original_currency}
              className="!text-inherit"
            />/kg
          </div>
        </div>

        {/* ── Traveler ── */}
        {trip.traveler && (
          <div
            className="flex items-center gap-3 pt-3"
            style={{ borderTop: '1px solid #f1f5f9' }}
          >
            {/* Avatar */}
            {trip.traveler.avatar ? (
              <img
                src={trip.traveler.avatar}
                alt={trip.traveler.name}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                }}
              >
                {trip.traveler.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-navy truncate">{trip.traveler.name}</p>
                {trip.traveler.kyc_status === 'approved' && (
                  <ShieldCheck
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: 'var(--color-royal-blue)' }}
                    aria-label="Identité vérifiée"
                  />
                )}
                {trip.traveler.is_recommended && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                    style={{
                      background: 'rgba(249,115,22,0.1)',
                      color: '#c2410c',
                    }}
                  >
                    <Star className="w-2.5 h-2.5" />
                    Top
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RatingStars rating={trip.traveler.rating} size="sm" />
                <span className="text-xs text-muted-text">
                  ({trip.traveler.completed_deliveries} livraisons)
                </span>
              </div>
            </div>

            {/* CTA hint on hover */}
            {onClick && (
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--color-royal-blue)' }}
                aria-hidden="true"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
