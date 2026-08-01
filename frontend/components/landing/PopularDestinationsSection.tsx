'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Plane } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Fallback static data if API fails or returns empty
const FALLBACK_DESTINATIONS = [
  {
    departure_city: 'Moscou',
    departure_country: 'Russie',
    arrival_city: 'Dakar',
    arrival_country: 'Sénégal',
    route: 'Moscou ↔ Dakar',
    delivery_time: '3-5 jours',
    trip_count: 24,
    image: 'https://images.pexels.com/photos/6269518/pexels-photo-6269518.jpeg',
    placeholderColor: '#768994',
  },
  {
    departure_city: 'Dakar',
    departure_country: 'Sénégal',
    arrival_city: 'Moscou',
    arrival_country: 'Russie',
    route: 'Dakar ↔ Moscou',
    delivery_time: '3-5 jours',
    trip_count: 18,
    image: 'https://images.pexels.com/photos/9833517/pexels-photo-9833517.jpeg',
    placeholderColor: '#99978A',
  },
  {
    departure_city: 'Abidjan',
    departure_country: "Côte d'Ivoire",
    arrival_city: 'Saint-Pétersbourg',
    arrival_country: 'Russie',
    route: 'Abidjan ↔ Saint-Pétersbourg',
    delivery_time: '4-6 jours',
    trip_count: 15,
    image: 'https://images.pexels.com/photos/3814231/pexels-photo-3814231.jpeg',
    placeholderColor: '#89949D',
  },
  {
    departure_city: 'Lagos',
    departure_country: 'Nigeria',
    arrival_city: 'Kazan',
    arrival_country: 'Russie',
    route: 'Lagos ↔ Kazan',
    delivery_time: '4-7 jours',
    trip_count: 12,
    image: 'https://images.unsplash.com/photo-1591018697062-771d09269fe6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxM3x8YWZyaWNhbiUyMGNpdHklMjBza3lsaW5lJTIwbW9kZXJuJTIwYnVpbGRpbmdzfGVufDB8MHx8fDE3NzM1MzQ3MjF8MA&ixlib=rb-4.1.0&q=85',
    placeholderColor: '#c0c0c0',
  },
];

// City images mapping (you can expand this)
const CITY_IMAGES: Record<string, string> = {
  'Moscou': 'https://images.pexels.com/photos/6269518/pexels-photo-6269518.jpeg',
  'Dakar': 'https://images.pexels.com/photos/9833517/pexels-photo-9833517.jpeg',
  'Abidjan': 'https://images.pexels.com/photos/3814231/pexels-photo-3814231.jpeg',
  'Lagos': 'https://images.unsplash.com/photo-1591018697062-771d09269fe6',
  'Saint-Pétersbourg': 'https://images.unsplash.com/photo-1556610961-2fecc5927173',
  'Kazan': 'https://images.unsplash.com/photo-1513326738677-b964603b136d',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05';

interface Route {
  departure_city: string;
  departure_country: string;
  arrival_city: string;
  arrival_country: string;
  route: string;
  delivery_time: string;
  trip_count: number;
  image?: string;
  placeholderColor?: string;
}

export function PopularDestinationsSection() {
  const { t } = useTranslation();
  const [destinations, setDestinations] = useState<Route[]>(FALLBACK_DESTINATIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPopularRoutes();
  }, []);

  const fetchPopularRoutes = async () => {
    try {
      const response = await apiClient.get<{ data: Route[] }>('/api/popular-routes');
      
      if (response.data && response.data.length > 0) {
        // Enrich with images
        const enrichedData = response.data.map(route => ({
          ...route,
          image: CITY_IMAGES[route.departure_city] || DEFAULT_IMAGE,
          placeholderColor: '#89949D',
        }));
        setDestinations(enrichedData);
      }
    } catch (error) {
      console.log('Using fallback destinations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
            {t('navigation.destinations') || 'Nos routes'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-4">
            {t('home.destinations.title') || 'Destinations Populaires'}
          </h2>
          <p className="text-body-text text-lg max-w-2xl mx-auto">
            {t('home.destinations.subtitle') || 'Les routes les plus populaires entre la Russie et l\'Afrique'}
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {destinations.slice(0, 4).map((dest, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden border border-light-border hover:shadow-xl hover:border-transparent transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={`${dest.departure_city}, ${dest.departure_country}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: dest.placeholderColor }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white text-2xl font-heading font-bold">
                    {dest.departure_city}
                  </h3>
                  <p className="text-white/80 text-sm">{dest.departure_country}</p>
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
                    <span>{dest.delivery_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-royal-blue" />
                    <span className="font-semibold text-royal-blue">
                      {dest.trip_count} {t('navigation.trips') || 'voyages'}
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
              {t('home.destinations.viewAll') || 'Voir toutes les destinations'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

