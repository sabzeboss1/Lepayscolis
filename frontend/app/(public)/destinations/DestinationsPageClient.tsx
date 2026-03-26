'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plane,
  Clock,
  ArrowRight,
  MapPin,
  Sparkles,
  TrendingUp,
  Globe,
  Users,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/Button';

const RUSSIAN_CITIES = [
  { name: 'Moscou', trips: 156, flag: '🇷🇺' },
  { name: 'Saint-Pétersbourg', trips: 89, flag: '🇷🇺' },
  { name: 'Kazan', trips: 45, flag: '🇷🇺' },
  { name: 'Sotchi', trips: 32, flag: '🇷🇺' },
];

const AFRICAN_CITIES = [
  { name: 'Le Caire', trips: 124, flag: '🇪🇬' },
  { name: 'Lagos', trips: 98, flag: '🇳🇬' },
  { name: 'Johannesburg', trips: 87, flag: '🇿🇦' },
  { name: 'Nairobi', trips: 76, flag: '🇰🇪' },
  { name: 'Casablanca', trips: 54, flag: '🇲🇦' },
  { name: 'Addis-Abeba', trips: 43, flag: '🇪🇹' },
];

const POPULAR_ROUTES = [
  {
    from: 'Moscou',
    to: 'Le Caire',
    activeTrips: 24,
    avgPrice: '8 €',
    avgDuration: '3-5 jours',
  },
  {
    from: 'Saint-Pétersbourg',
    to: 'Lagos',
    activeTrips: 18,
    avgPrice: '12 €',
    avgDuration: '4-7 jours',
  },
  {
    from: 'Moscou',
    to: 'Johannesburg',
    activeTrips: 15,
    avgPrice: '10 €',
    avgDuration: '5-8 jours',
  },
  {
    from: 'Kazan',
    to: 'Nairobi',
    activeTrips: 12,
    avgPrice: '9 €',
    avgDuration: '4-6 jours',
  },
  {
    from: 'Moscou',
    to: 'Casablanca',
    activeTrips: 11,
    avgPrice: '7 €',
    avgDuration: '3-5 jours',
  },
  {
    from: 'Saint-Pétersbourg',
    to: 'Addis-Abeba',
    activeTrips: 9,
    avgPrice: '11 €',
    avgDuration: '5-7 jours',
  },
];

export function DestinationsPageClient() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-royal-blue to-ocean-blue pt-32 pb-20 sm:pt-36 sm:pb-24">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-[-5%] top-16 h-48 w-48 rounded-full bg-vibrant-orange blur-3xl" />
            <div className="absolute right-[-10%] bottom-0 h-72 w-72 rounded-full bg-white blur-3xl" />
          </div>
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm font-medium mb-8 border border-white/15 backdrop-blur-sm">
              <Globe className="w-4 h-4 text-vibrant-orange" />
              Nos routes
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Destinations Populaires
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              Explorez les routes les plus populaires entre la Russie et l&apos;Afrique.
              Trouvez des voyageurs et expéditeurs connectant des dizaines de villes.
            </p>

            {/* Quick stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-xs text-white/70 mt-1">Destinations</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">200+</p>
                <p className="text-xs text-white/70 mt-1">Voyages actifs</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">3-7j</p>
                <p className="text-xs text-white/70 mt-1">Délai moyen</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
              <path
                d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* Cities Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
                Villes desservies
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
                Russie & Afrique connectées
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Russia */}
              <div className="bg-white rounded-2xl border border-light-border p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-royal-blue" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-royal-blue">
                    Russie
                  </h3>
                </div>
                <div className="space-y-3">
                  {RUSSIAN_CITIES.map((city, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3.5 bg-soft-gray rounded-xl hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{city.flag}</span>
                        <span className="font-medium text-navy">{city.name}</span>
                      </div>
                      <span className="text-sm text-royal-blue font-semibold">
                        {city.trips} voyages
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Africa */}
              <div className="bg-white rounded-2xl border border-light-border p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-vibrant-orange" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-vibrant-orange">
                    Afrique
                  </h3>
                </div>
                <div className="space-y-3">
                  {AFRICAN_CITIES.map((city, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3.5 bg-soft-gray rounded-xl hover:bg-orange-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{city.flag}</span>
                        <span className="font-medium text-navy">{city.name}</span>
                      </div>
                      <span className="text-sm text-vibrant-orange font-semibold">
                        {city.trips} voyages
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Routes */}
        <section className="py-20 bg-soft-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
                Routes populaires
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
                Les trajets les plus demandés
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {POPULAR_ROUTES.map((route, index) => (
                <article
                  key={index}
                  className="group bg-white rounded-2xl border border-light-border p-6 hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-semibold text-navy">{route.from}</span>
                    </div>
                    <div className="flex items-center gap-2 my-3">
                      <div className="h-px flex-1 bg-light-border" />
                      <Plane className="w-5 h-5 text-royal-blue transition-transform group-hover:translate-x-1" />
                      <div className="h-px flex-1 bg-light-border" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-navy">{route.to}</span>
                    </div>
                  </div>

                  <div className="border-t border-light-border pt-4 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-body-text">
                        <Users className="w-3.5 h-3.5 text-muted-text" />
                        Voyages actifs
                      </span>
                      <span className="font-semibold text-royal-blue">{route.activeTrips}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-body-text">
                        <TrendingUp className="w-3.5 h-3.5 text-muted-text" />
                        Prix moyen/kg
                      </span>
                      <span className="font-semibold text-navy">{route.avgPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-body-text">
                        <Clock className="w-3.5 h-3.5 text-muted-text" />
                        Durée moyenne
                      </span>
                      <span className="font-semibold text-navy">{route.avgDuration}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Direction Cards */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-light-border p-8 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-royal-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform group-hover:scale-110">
                  <ArrowRight className="w-8 h-8 text-royal-blue" />
                </div>
                <h3 className="text-xl font-heading font-bold text-royal-blue mb-2">
                  Russie → Afrique
                </h3>
                <p className="text-body-text text-sm">
                  Envoyez vos colis de la Russie vers l&apos;Afrique via nos voyageurs de confiance
                </p>
              </div>

              <div className="group bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-light-border p-8 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-vibrant-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform group-hover:scale-110">
                  <ArrowRight className="w-8 h-8 text-vibrant-orange rotate-180" />
                </div>
                <h3 className="text-xl font-heading font-bold text-vibrant-orange mb-2">
                  Afrique → Russie
                </h3>
                <p className="text-body-text text-sm">
                  Envoyez vos colis de l&apos;Afrique vers la Russie via nos voyageurs de confiance
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-royal-blue/90 to-navy" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-vibrant-orange/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-ocean-blue/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-8 border border-white/10">
              <Sparkles className="w-4 h-4 text-vibrant-orange" />
              Destination non listée ?
            </div>

            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">
              De nouvelles routes sont ajoutées chaque jour
            </h2>
            <p className="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto">
              Inscrivez-vous pour être notifié lorsque des voyageurs se rendent vers votre destination.
            </p>
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-vibrant-orange hover:bg-warm-orange text-white px-10 py-4 text-base font-bold shadow-xl shadow-orange-500/30 border-0 gap-2 group"
              >
                Inscrivez-vous gratuitement
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
