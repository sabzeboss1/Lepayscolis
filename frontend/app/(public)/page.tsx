'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeaderPublic } from '@/components/layout/HeaderPublic';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/config';

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation(locale);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const popularDestinations = [
    { from: t('destinationsPage.cities.russia.moscow'), to: t('destinationsPage.cities.africa.cairo'), trips: 24 },
    { from: t('destinationsPage.cities.russia.stPetersburg'), to: t('destinationsPage.cities.africa.lagos'), trips: 18 },
    { from: t('destinationsPage.cities.russia.moscow'), to: t('destinationsPage.cities.africa.johannesburg'), trips: 15 },
    { from: t('destinationsPage.cities.russia.kazan'), to: t('destinationsPage.cities.africa.nairobi'), trips: 12 },
  ];

  const testimonials = [
    {
      text: t('home.testimonials.testimonial1.text'),
      author: t('home.testimonials.testimonial1.author'),
      location: t('home.testimonials.testimonial1.location'),
      rating: 5,
      deliveries: 12,
      verified: true,
    },
    {
      text: t('home.testimonials.testimonial2.text'),
      author: t('home.testimonials.testimonial2.author'),
      location: t('home.testimonials.testimonial2.location'),
      rating: 5,
      deliveries: 8,
      verified: true,
    },
    {
      text: t('home.testimonials.testimonial3.text'),
      author: t('home.testimonials.testimonial3.author'),
      location: t('home.testimonials.testimonial3.location'),
      rating: 5,
      deliveries: 15,
      verified: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <HeaderPublic locale={locale} />

      <main>
        {/* Hero Section avec animation */}
        <section className="relative pt-16 pb-24 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-orange-50"></div>

          {/* Animated Circles */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {t('home.hero.badge')}
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                {t('home.hero.title').split(t('home.hero.titleHighlight'))[0]}
                <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent"> {t('home.hero.titleHighlight')}</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                {t('home.hero.subtitle')}
              </p>

              {/* Choix des 2 rôles */}
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
                <Link href="/auth/register?role=sender" className="block">
                  <Card className="p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-white group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        📦
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{t('home.roles.sender.title')}</h3>
                        <p className="text-xs text-gray-600">{t('home.roles.sender.description')}</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/auth/register?role=traveler" className="block">
                  <Card className="p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 bg-white group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        ✈️
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{t('home.roles.traveler.title')}</h3>
                        <p className="text-xs text-gray-600">{t('home.roles.traveler.description')}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link href="/how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {t('navigation.howItWorks')}
                  </Button>
                </Link>
              </div>

              {/* Preuve sociale */}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg mb-8">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-xl">⭐</span>
                  <span className="text-yellow-400 text-xl">⭐</span>
                  <span className="text-yellow-400 text-xl">⭐</span>
                  <span className="text-yellow-400 text-xl">⭐</span>
                  <span className="text-yellow-400 text-xl">⭐</span>
                </div>
                <span className="text-gray-900 font-semibold">4.8/5</span>
                <span className="text-gray-600">basé sur 2,000 livraisons vérifiées</span>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('home.trustIndicators.securePayment')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('home.trustIndicators.verifiedUsers')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('home.trustIndicators.support247')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">2,000+</div>
                <div className="text-sm md:text-base text-gray-600">{t('home.stats.deliveries')}</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">500+</div>
                <div className="text-sm md:text-base text-gray-600">{t('home.stats.travelers')}</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">50+</div>
                <div className="text-sm md:text-base text-gray-600">{t('home.stats.destinations')}</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">4.8★</div>
                <div className="text-sm md:text-base text-gray-600">{t('home.stats.rating')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">{t('navigation.howItWorks')}</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
                {t('home.howItWorks.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('home.hero.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
              {/* For Senders */}
              <div className="group">
                <Card className="p-6 md:p-8 lg:p-10 h-full border-2 border-transparent hover:border-blue-200 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-white backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl shadow-lg group-hover:scale-110 transition-transform">
                      📦
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-blue-600">
                      {t('home.howItWorks.sender')}
                    </h3>
                  </div>
                  <div className="space-y-4 md:space-y-5">
                    <div className="flex gap-3 md:gap-4 group/item">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover/item:scale-110 transition-transform">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Recherchez un voyageur</p>
                        <p className="text-gray-600 text-xs md:text-sm">{t('home.howItWorks.senderStep1')}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 md:gap-4 group/item">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover/item:scale-110 transition-transform">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Payez en sécurité</p>
                        <p className="text-gray-600 text-xs md:text-sm">{t('home.howItWorks.senderStep2')}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 md:gap-4 group/item">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover/item:scale-110 transition-transform">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Suivez votre colis</p>
                        <p className="text-gray-600 text-xs md:text-sm">{t('home.howItWorks.senderStep3')}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* For Travelers */}
              <div className="group">
                <Card className="p-6 md:p-8 lg:p-10 h-full border-2 border-transparent hover:border-orange-200 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-50/50 to-white backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl shadow-lg group-hover:scale-110 transition-transform">
                      ✈️
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-orange-600">
                      {t('home.howItWorks.traveler')}
                    </h3>
                  </div>
                  <div className="space-y-4 md:space-y-5">
                    <div className="flex gap-3 md:gap-4 group/item">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover/item:scale-110 transition-transform">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Publiez votre voyage</p>
                        <p className="text-gray-600 text-xs md:text-sm">{t('home.howItWorks.travelerStep1')}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 md:gap-4 group/item">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover/item:scale-110 transition-transform">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Acceptez des demandes</p>
                        <p className="text-gray-600 text-xs md:text-sm">{t('home.howItWorks.travelerStep2')}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 md:gap-4 group/item">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover/item:scale-110 transition-transform">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Livrez et gagnez</p>
                        <p className="text-gray-600 text-xs md:text-sm">{t('home.howItWorks.travelerStep3')}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/how-it-works">
                <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200">
                  {t('common.learnMore')} →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Avantages</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
                {t('home.benefits.title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
              <Card className="p-6 md:p-8 text-center group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center text-4xl md:text-5xl mx-auto mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  🛡️
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                  {t('home.benefits.safe.title')}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {t('home.benefits.safe.description')}
                </p>
              </Card>

              <Card className="p-6 md:p-8 text-center group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl flex items-center justify-center text-4xl md:text-5xl mx-auto mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  🔒
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                  Paiement bloqué
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  L'argent est libéré uniquement après livraison confirmée
                </p>
              </Card>

              <Card className="p-6 md:p-8 text-center group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl flex items-center justify-center text-4xl md:text-5xl mx-auto mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  💰
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                  {t('home.benefits.affordable.title')}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {t('home.benefits.affordable.description')}
                </p>
              </Card>

              <Card className="p-6 md:p-8 text-center group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center text-4xl md:text-5xl mx-auto mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                  🤝
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                  {t('home.benefits.community.title')}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {t('home.benefits.community.description')}
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Témoignages</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
                {t('home.testimonials.title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-5 md:p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-100 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={testimonial.rating} size="sm" />
                      <span className="text-sm font-semibold text-gray-700">{testimonial.rating}.0</span>
                    </div>
                    {testimonial.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-gray-700 mb-4 italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm md:text-base">{testimonial.author}</p>
                        <p className="text-xs md:text-sm text-gray-600">{testimonial.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{testimonial.deliveries} livraisons</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Destinations</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
                {t('home.destinations.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Les destinations les plus actives entre la Russie et l'Afrique
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {popularDestinations.map((destination, index) => (
                <Card key={index} className="p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-100 bg-gradient-to-br from-white to-blue-50/20 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">{destination.from}</p>
                      <div className="flex items-center gap-2 my-4">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-300 to-orange-300"></div>
                        <span className="text-2xl group-hover:scale-125 transition-transform">✈️</span>
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-300 to-blue-300"></div>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{destination.to}</p>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <p className="text-3xl font-bold text-white">{destination.trips}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{t('destinationsPage.stats.activeTrips')}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/destinations">
                <Button variant="outline" size="lg" className="border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white transition-all duration-200">
                  {t('home.destinations.viewAll')} →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Questions fréquentes</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
                Vous avez des questions ?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">❓</span>
                  Est-ce légal ?
                </h3>
                <p className="text-gray-600">
                  Oui, notre service respecte toutes les réglementations internationales. Seuls les objets autorisés peuvent être transportés.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">💳</span>
                  Comment je suis payé ?
                </h3>
                <p className="text-gray-600">
                  Le paiement est bloqué en sécurité et libéré automatiquement après confirmation de livraison par le destinataire.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-red-600">⚠️</span>
                  Que se passe-t-il en cas de problème ?
                </h3>
                <p className="text-gray-600">
                  Notre équipe support intervient rapidement. L'argent reste bloqué jusqu'à résolution du litige.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-gray-600">🚫</span>
                  Quels objets sont interdits ?
                </h3>
                <p className="text-gray-600">
                  Armes, drogues, produits dangereux, contrefaçons et tout objet illégal sont strictement interdits.
                </p>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Link href="/faq">
                <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200">
                  Voir toutes les questions →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t('home.finalCta.title')}
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              {t('home.finalCta.subtitle')}
            </p>
            <Link href="/auth/register">
              <Button variant="primary" size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl shadow-orange-500/50 transform hover:scale-105 transition-all duration-200">
                {t('home.finalCta.cta')} →
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
