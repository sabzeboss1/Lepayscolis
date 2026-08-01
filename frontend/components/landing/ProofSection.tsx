'use client';

import React from 'react';
import { Package, Users, MapPin, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function ProofSection() {
  const { t } = useTranslation();

  const stats = [
    {
      value: '2 000+',
      label: t('home.stats.deliveries') || 'Colis Livrés',
      icon: Package,
      color: 'text-royal-blue',
      bg: 'bg-royal-blue/10',
    },
    {
      value: '500+',
      label: t('home.stats.travelers') || 'Voyageurs Actifs',
      icon: Users,
      color: 'text-vibrant-orange',
      bg: 'bg-vibrant-orange/10',
    },
    {
      value: '50+',
      label: t('home.stats.destinations') || 'Destinations',
      icon: MapPin,
      color: 'text-success-green',
      bg: 'bg-success-green/10',
    },
    {
      value: '4.8/5',
      label: t('home.stats.rating') || 'Note Moyenne',
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center group"
              >
                <div
                  className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110`}
                >
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-body-text font-medium">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

