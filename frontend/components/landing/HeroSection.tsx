'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Users, Headphones, Plane } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/3453030/pexels-photo-3453030.jpeg"
          alt="Vue aérienne de voyage"
          className="w-full h-full object-cover"
          style={{ backgroundColor: '#586460' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/85 to-royal-blue/70" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white/90 border border-white/15 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-green" />
              </span>
              {t('home.hero.badge') || 'Plateforme de confiance pour vos colis'}
            </div>

            {/* Title */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('home.hero.title') || 'Expédiez vos colis entre la Russie et l\'Afrique'}
            </h1>

            <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-lg leading-relaxed font-body">
              {t('home.hero.subtitle') || 'Connectez-vous avec des voyageurs de confiance pour une livraison rapide, sûre et économique.'}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-vibrant-orange hover:bg-warm-orange text-white px-8 py-4 text-base font-bold shadow-xl shadow-orange-500/30 border-0 gap-2 group"
                >
                  <Plane className="w-5 h-5" />
                  {t('home.roles.sender.title') || 'Envoyer un Colis'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 backdrop-blur-sm text-white border-white/20 hover:bg-white/15 px-8 py-4 text-base font-semibold"
                >
                  {t('navigation.howItWorks') || 'Comment ça marche'}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-success-green" />
                <span>{t('home.trustIndicators.securePayment') || 'Paiement Sécurisé'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-success-green" />
                <span>{t('home.trustIndicators.verifiedUsers') || 'Utilisateurs Vérifiés'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-success-green" />
                <span>{t('home.trustIndicators.support247') || 'Support 24/7'}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Floating Cards */}
          <div className="hidden lg:block relative">
            <div className="relative w-full h-[480px]">
              {/* Main card */}
              <div className="absolute top-8 right-0 w-72 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-vibrant-orange/20 rounded-xl flex items-center justify-center">
                    <Plane className="w-5 h-5 text-vibrant-orange" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t('home.roles.traveler.title') || 'Nouveau Voyage'}</p>
                    <p className="text-white/60 text-xs">Moscou → Dakar</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">{t('trips.capacity') || 'Capacité'}</span>
                    <span className="text-white font-medium">15 kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">{t('trips.pricePerKg') || 'Prix/kg'}</span>
                    <span className="text-vibrant-orange font-medium">8 €/kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">{t('trips.departureDate') || 'Départ'}</span>
                    <span className="text-white font-medium">25 Mars 2026</span>
                  </div>
                  <div className="w-full h-px bg-white/10 my-1" />
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.pravatar.cc/32?u=amadou"
                      alt="Amadou K."
                      className="w-7 h-7 rounded-full"
                      width={28}
                      height={28}
                    />
                    <div>
                      <p className="text-white text-xs font-medium">Amadou K.</p>
                      <p className="text-yellow-400 text-xs">★ 4.9 · 23 {t('home.stats.deliveries') || 'livraisons'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats card */}
              <div className="absolute bottom-16 left-0 w-56 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-2xl">
                <p className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">{t('home.stats.thisWeek') || 'Cette semaine'}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-success-green/20 rounded-lg flex items-center justify-center">
                      <span className="text-success-green text-sm font-bold">↑</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">+127</p>
                      <p className="text-white/50 text-xs">{t('home.stats.newUsers') || 'Nouveaux utilisateurs'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-vibrant-orange/20 rounded-lg flex items-center justify-center">
                      <span className="text-vibrant-orange text-sm font-bold">📦</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">48</p>
                      <p className="text-white/50 text-xs">{t('home.stats.parcelsInTransit') || 'Colis en transit'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification card */}
              <div className="absolute top-64 left-12 w-64 bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success-green/20 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-success-green text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t('home.stats.deliveryConfirmed') || 'Livraison confirmée !'}</p>
                    <p className="text-white/50 text-xs">5 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
