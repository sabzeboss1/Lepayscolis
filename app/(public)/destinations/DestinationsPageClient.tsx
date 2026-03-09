'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeaderPublic } from '@/components/layout/HeaderPublic';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/config';

export function DestinationsPageClient() {
  const [locale, setLocale] = useState<Locale>('en');
  const { t } = useTranslation(locale);

  const russianCities = [
    { name: t('destinationsPage.cities.russia.moscow'), trips: 156 },
    { name: t('destinationsPage.cities.russia.stPetersburg'), trips: 89 },
    { name: t('destinationsPage.cities.russia.kazan'), trips: 45 },
    { name: t('destinationsPage.cities.russia.sochi'), trips: 32 },
  ];

  const africanCities = [
    { name: t('destinationsPage.cities.africa.cairo'), trips: 124 },
    { name: t('destinationsPage.cities.africa.lagos'), trips: 98 },
    { name: t('destinationsPage.cities.africa.johannesburg'), trips: 87 },
    { name: t('destinationsPage.cities.africa.nairobi'), trips: 76 },
    { name: t('destinationsPage.cities.africa.casablanca'), trips: 54 },
    { name: t('destinationsPage.cities.africa.addisAbaba'), trips: 43 },
  ];

  const popularRoutes = [
    {
      from: t('destinationsPage.cities.russia.moscow'),
      to: t('destinationsPage.cities.africa.cairo'),
      activeTrips: 24,
      avgPrice: '$8',
      avgDuration: '3-5 days',
    },
    {
      from: t('destinationsPage.cities.russia.stPetersburg'),
      to: t('destinationsPage.cities.africa.lagos'),
      activeTrips: 18,
      avgPrice: '$12',
      avgDuration: '4-7 days',
    },
    {
      from: t('destinationsPage.cities.russia.moscow'),
      to: t('destinationsPage.cities.africa.johannesburg'),
      activeTrips: 15,
      avgPrice: '$10',
      avgDuration: '5-8 days',
    },
    {
      from: t('destinationsPage.cities.russia.kazan'),
      to: t('destinationsPage.cities.africa.nairobi'),
      activeTrips: 12,
      avgPrice: '$9',
      avgDuration: '4-6 days',
    },
    {
      from: t('destinationsPage.cities.russia.moscow'),
      to: t('destinationsPage.cities.africa.casablanca'),
      activeTrips: 11,
      avgPrice: '$7',
      avgDuration: '3-5 days',
    },
    {
      from: t('destinationsPage.cities.russia.stPetersburg'),
      to: t('destinationsPage.cities.africa.addisAbaba'),
      activeTrips: 9,
      avgPrice: '$11',
      avgDuration: '5-7 days',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeaderPublic locale={locale} />

      <main className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('destinationsPage.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('destinationsPage.description')}
            </p>
          </div>

          {/* Popular Cities */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {t('destinationsPage.routes.title')}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Russia */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🇷🇺</div>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {t('destinationsPage.cities.russia.title')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {russianCities.map((city, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{city.name}</span>
                      <span className="text-sm text-gray-600">{city.trips} trips</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Africa */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🌍</div>
                  <h3 className="text-2xl font-bold text-orange-600">
                    {t('destinationsPage.cities.africa.title')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {africanCities.map((city, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{city.name}</span>
                      <span className="text-sm text-gray-600">{city.trips} trips</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Popular Routes with Statistics */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {t('destinationsPage.stats.title')}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRoutes.map((route, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{route.from}</span>
                    </div>
                    <div className="flex items-center gap-2 my-3">
                      <div className="h-px flex-1 bg-gray-300"></div>
                      <span className="text-blue-600 text-xl">✈️</span>
                      <div className="h-px flex-1 bg-gray-300"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{route.to}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('destinationsPage.stats.activeTrips')}:</span>
                      <span className="font-semibold text-blue-600">{route.activeTrips}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('destinationsPage.stats.avgPrice')}:</span>
                      <span className="font-semibold text-gray-900">{route.avgPrice}/kg</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('destinationsPage.stats.avgDuration')}:</span>
                      <span className="font-semibold text-gray-900">{route.avgDuration}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Direction Indicators */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-white">
                <div className="text-5xl mb-4">→</div>
                <h3 className="text-xl font-bold text-blue-600 mb-2">
                  {t('destinationsPage.routes.russiaToAfrica')}
                </h3>
                <p className="text-gray-600">
                  Send packages from Russia to Africa
                </p>
              </Card>

              <Card className="p-8 text-center bg-gradient-to-br from-orange-50 to-white">
                <div className="text-5xl mb-4">←</div>
                <h3 className="text-xl font-bold text-orange-600 mb-2">
                  {t('destinationsPage.routes.africaToRussia')}
                </h3>
                <p className="text-gray-600">
                  Send packages from Africa to Russia
                </p>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-3xl mx-auto text-center">
            <Card className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Don't see your destination?
              </h3>
              <p className="text-lg mb-6 text-blue-100">
                New routes are added daily. Register to get notified when travelers are going to your destination.
              </p>
              <Link href="/auth/register">
                <Button variant="primary" size="lg" className="bg-orange-500 hover:bg-orange-600">
                  {t('common.getStarted')}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
