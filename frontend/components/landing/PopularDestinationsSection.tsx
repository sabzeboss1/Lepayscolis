'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Plane } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const DESTINATIONS = [
  {
    city: 'Moscou',
    country: 'Russie',
    route: 'Moscou ↔ Dakar',
    deliveryTime: '3-5 jours',
    trips: 24,
    image:
      'https://images.pexels.com/photos/6269518/pexels-photo-6269518.jpeg',
    attribution: 'Nikolai Kolosov sur Pexels',
    placeholderColor: '#768994',
  },
  {
    city: 'Dakar',
    country: 'Sénégal',
    route: 'Dakar ↔ Moscou',
    deliveryTime: '3-5 jours',
    trips: 18,
    image:
      'https://images.pexels.com/photos/9833517/pexels-photo-9833517.jpeg',
    attribution: 'Justin Brian sur Pexels',
    placeholderColor: '#99978A',
  },
  {
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    route: 'Abidjan ↔ Saint-Pétersbourg',
    deliveryTime: '4-6 jours',
    trips: 15,
    image:
      'https://images.pexels.com/photos/3814231/pexels-photo-3814231.jpeg',
    attribution: 'Magda Ehlers sur Pexels',
    placeholderColor: '#89949D',
  },
  {
    city: 'Lagos',
    country: 'Nigeria',
    route: 'Lagos ↔ Kazan',
    deliveryTime: '4-7 jours',
    trips: 12,
    image:
      'https://images.unsplash.com/photo-1591018697062-771d09269fe6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxM3x8YWZyaWNhbiUyMGNpdHklMjBza3lsaW5lJTIwbW9kZXJuJTIwYnVpbGRpbmdzfGVufDB8MHx8fDE3NzM1MzQ3MjF8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'Sipho Ndebele sur Unsplash',
    placeholderColor: '#c0c0c0',
  },
];

export function PopularDestinationsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
            Nos routes
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-4">
            Destinations Populaires
          </h2>
          <p className="text-body-text text-lg max-w-2xl mx-auto">
            Les routes les plus populaires entre la Russie et l&apos;Afrique
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {DESTINATIONS.map((dest, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden border border-light-border hover:shadow-xl hover:border-transparent transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={`${dest.city}, ${dest.country} - Photo par ${dest.attribution}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: dest.placeholderColor }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white text-2xl font-heading font-bold">
                    {dest.city}
                  </h3>
                  <p className="text-white/80 text-sm">{dest.country}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <p className="text-navy font-semibold text-sm mb-3">
                  {dest.route}
                </p>
                <div className="flex items-center justify-between text-sm text-body-text">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-text" />
                    <span>{dest.deliveryTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-royal-blue" />
                    <span className="font-semibold text-royal-blue">
                      {dest.trips} voyages
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/destinations">
            <Button
              variant="outline"
              className="border-2 border-royal-blue text-royal-blue hover:bg-royal-blue hover:text-white font-semibold gap-2 group"
            >
              Voir toutes les destinations
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
