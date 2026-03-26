'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  CreditCard,
  PackageCheck,
  Plane,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Send,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/Button';

const SENDER_STEPS = [
  {
    number: 1,
    title: 'Trouvez un voyageur',
    description:
      'Utilisez nos filtres de recherche pour trouver le voyageur idéal selon votre destination, vos dates et votre budget.',
    hint: 'Filtrez par destination, date et capacité disponible',
    icon: Search,
    gradient: 'from-royal-blue to-ocean-blue',
    lightBg: 'bg-blue-50',
    lightColor: 'text-royal-blue',
  },
  {
    number: 2,
    title: 'Réservez et payez',
    description:
      'Réservez en toute sécurité. Votre paiement est gardé en escrow jusqu\'à la confirmation de livraison.',
    hint: 'Paiement sécurisé en escrow jusqu\'à la livraison',
    icon: CreditCard,
    gradient: 'from-vibrant-orange to-yellow-500',
    lightBg: 'bg-orange-50',
    lightColor: 'text-vibrant-orange',
  },
  {
    number: 3,
    title: 'Suivez votre colis',
    description:
      'Restez informé avec le suivi en temps réel de votre colis. Recevez des notifications à chaque étape.',
    hint: 'Notifications en temps réel du statut de livraison',
    icon: PackageCheck,
    gradient: 'from-success-green to-emerald-400',
    lightBg: 'bg-green-50',
    lightColor: 'text-success-green',
  },
];

const TRAVELER_STEPS = [
  {
    number: 1,
    title: 'Publiez votre voyage',
    description:
      'Partagez vos plans de voyage et l\'espace disponible dans vos bagages. C\'est simple et rapide.',
    hint: 'Indiquez votre itinéraire et capacité disponible',
    icon: Plane,
    gradient: 'from-vibrant-orange to-yellow-500',
    lightBg: 'bg-orange-50',
    lightColor: 'text-vibrant-orange',
  },
  {
    number: 2,
    title: 'Acceptez des demandes',
    description:
      'Choisissez les demandes qui correspondent à votre voyage. Vous gardez le contrôle total.',
    hint: 'Sélectionnez les colis qui vous conviennent',
    icon: CheckCircle2,
    gradient: 'from-royal-blue to-ocean-blue',
    lightBg: 'bg-blue-50',
    lightColor: 'text-royal-blue',
  },
  {
    number: 3,
    title: 'Livrez et gagnez',
    description:
      'Livrez le colis et recevez votre paiement automatiquement après confirmation du destinataire.',
    hint: 'Paiement libéré automatiquement après confirmation',
    icon: Send,
    gradient: 'from-success-green to-emerald-400',
    lightBg: 'bg-green-50',
    lightColor: 'text-success-green',
  },
];

export function HowItWorksPageClient() {
  const [activeTab, setActiveTab] = useState<'send' | 'travel'>('send');
  const steps = activeTab === 'send' ? SENDER_STEPS : TRAVELER_STEPS;

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-royal-blue to-ocean-blue pt-32 pb-20 sm:pt-36 sm:pb-24">
          {/* Decorative blobs */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-[-5%] top-16 h-48 w-48 rounded-full bg-vibrant-orange blur-3xl" />
            <div className="absolute right-[-10%] bottom-0 h-72 w-72 rounded-full bg-white blur-3xl" />
          </div>
          {/* Grid pattern */}
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
              <Sparkles className="w-4 h-4 text-vibrant-orange" />
              Simple et rapide
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Comment ça marche
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              Découvrez comment envoyer un colis ou gagner de l&apos;argent en voyageant
              en quelques étapes simples.
            </p>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
              <path
                d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* Tab Selector */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-soft-gray rounded-2xl p-1.5 gap-1" role="tablist">
                <button
                  onClick={() => setActiveTab('send')}
                  role="tab"
                  aria-selected={activeTab === 'send'}
                  className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue focus-visible:ring-offset-2 ${
                    activeTab === 'send'
                      ? 'bg-white text-royal-blue shadow-sm'
                      : 'text-body-text hover:text-navy'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4" />
                    Je veux envoyer un colis
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('travel')}
                  role="tab"
                  aria-selected={activeTab === 'travel'}
                  className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-orange focus-visible:ring-offset-2 ${
                    activeTab === 'travel'
                      ? 'bg-white text-vibrant-orange shadow-sm'
                      : 'text-body-text hover:text-navy'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    Je suis voyageur
                  </span>
                </button>
              </div>
            </div>

            {/* Section Eyebrow */}
            <div className="text-center mb-12">
              <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
                {activeTab === 'send' ? 'Expéditeurs' : 'Voyageurs'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
                {activeTab === 'send'
                  ? 'Envoyez votre colis en 3 étapes'
                  : 'Gagnez de l\'argent en 3 étapes'}
              </h2>
            </div>

            {/* Steps - Desktop */}
            <div className="hidden md:grid md:grid-cols-3 gap-8 relative" role="tabpanel">
              {/* Connection line */}
              <div
                className={`absolute top-14 left-[16%] right-[16%] h-0.5 bg-gradient-to-r ${
                  activeTab === 'send'
                    ? 'from-royal-blue via-vibrant-orange to-success-green'
                    : 'from-vibrant-orange via-royal-blue to-success-green'
                } opacity-20`}
              />

              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="text-center relative z-10">
                    <div
                      className={`w-28 h-28 bg-gradient-to-br ${step.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform hover:scale-105`}
                    >
                      <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-8 h-8 bg-white border-[3px] border-navy rounded-full flex items-center justify-center text-navy font-heading font-bold text-sm mx-auto mb-4 shadow-sm">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-heading font-bold text-navy mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-body-text leading-relaxed max-w-[260px] mx-auto mb-4">
                      {step.description}
                    </p>
                    <div className={`${step.lightBg} rounded-xl p-3 max-w-[240px] mx-auto`}>
                      <p className={`text-xs font-medium ${step.lightColor}`}>
                        {step.hint}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Steps - Mobile */}
            <div className="md:hidden space-y-8" role="tabpanel">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex items-start gap-5">
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                      </div>
                      {index < steps.length - 1 && (
                        <div className="w-0.5 h-8 bg-light-border mt-2" />
                      )}
                    </div>
                    <div className="pt-1 flex-1">
                      <span className="text-xs font-bold text-muted-text font-heading uppercase">
                        Étape {step.number}
                      </span>
                      <h3 className="text-lg font-heading font-bold text-navy mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-body-text leading-relaxed mb-3">
                        {step.description}
                      </p>
                      <div className={`${step.lightBg} rounded-xl p-3`}>
                        <p className={`text-xs font-medium ${step.lightColor}`}>
                          {step.hint}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA under steps */}
            <div className="text-center mt-14">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className={`px-10 py-4 text-base font-bold shadow-xl border-0 gap-2 group ${
                    activeTab === 'send'
                      ? 'bg-royal-blue hover:bg-ocean-blue text-white shadow-blue-500/30'
                      : 'bg-vibrant-orange hover:bg-warm-orange text-white shadow-orange-500/30'
                  }`}
                >
                  Commencer maintenant
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Additional Links */}
        <section className="py-20 bg-soft-gray">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
                Aller plus loin
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
                Prêt à commencer ?
              </h2>
              <p className="text-body-text text-lg mt-4 max-w-2xl mx-auto">
                Rejoignez des milliers d&apos;utilisateurs qui font confiance à Tuma Plus
                pour leurs envois entre la Russie et l&apos;Afrique.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Link
                href="/security"
                className="group bg-white rounded-2xl p-6 border border-light-border hover:shadow-xl hover:border-transparent transition-all duration-300"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <MapPin className="w-6 h-6 text-royal-blue" />
                </div>
                <h3 className="text-lg font-heading font-bold text-navy mb-2">
                  Sécurité & Confiance
                </h3>
                <p className="text-sm text-body-text leading-relaxed">
                  Découvrez nos mesures de sécurité : vérification KYC, paiement escrow et système d&apos;avis.
                </p>
              </Link>

              <Link
                href="/faq"
                className="group bg-white rounded-2xl p-6 border border-light-border hover:shadow-xl hover:border-transparent transition-all duration-300"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <Sparkles className="w-6 h-6 text-vibrant-orange" />
                </div>
                <h3 className="text-lg font-heading font-bold text-navy mb-2">
                  Questions Fréquentes
                </h3>
                <p className="text-sm text-body-text leading-relaxed">
                  Trouvez les réponses à toutes vos questions sur notre plateforme.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-royal-blue/90 to-navy" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-vibrant-orange/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-ocean-blue/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto">
              Créez votre compte gratuitement et commencez à envoyer ou transporter des colis dès aujourd&apos;hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-vibrant-orange hover:bg-warm-orange text-white px-10 py-4 text-base font-bold shadow-xl shadow-orange-500/30 border-0 gap-2 group"
                >
                  Créer un Compte Gratuit
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/destinations">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 text-white border-white/20 hover:bg-white/15 px-10 py-4 text-base font-semibold"
                >
                  Voir les destinations
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
