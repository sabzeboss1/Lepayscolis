'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Star,
  BadgeCheck,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Eye,
  Fingerprint,
  CreditCard,
  Users,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/Button';

const SECURITY_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Vérification KYC',
    description:
      'Tous nos utilisateurs sont vérifiés avec un processus KYC complet pour garantir votre sécurité et votre tranquillité d\'esprit.',
    gradient: 'from-royal-blue to-ocean-blue',
    lightBg: 'bg-blue-50',
    lightColor: 'text-royal-blue',
    benefits: [
      { icon: Fingerprint, text: 'Vérification d\'identité complète' },
      { icon: Eye, text: 'Validation des documents officiels' },
      { icon: BadgeCheck, text: 'Profils vérifiés et badge de confiance' },
      { icon: Users, text: 'Communauté 100% vérifiée' },
    ],
  },
  {
    icon: Lock,
    title: 'Paiement Escrow Sécurisé',
    description:
      'Votre argent est protégé jusqu\'à la livraison confirmée. Notre système de paiement escrow garantit chaque transaction.',
    gradient: 'from-vibrant-orange to-yellow-500',
    lightBg: 'bg-orange-50',
    lightColor: 'text-vibrant-orange',
    benefits: [
      { icon: CreditCard, text: 'Paiement sécurisé par Stripe' },
      { icon: Lock, text: 'Fonds bloqués jusqu\'à confirmation' },
      { icon: ShieldCheck, text: 'Protection acheteur et vendeur' },
      { icon: CheckCircle2, text: 'Remboursement garanti en cas de litige' },
    ],
  },
  {
    icon: Star,
    title: 'Système de Notes et Avis',
    description:
      'Un système transparent de notation et d\'avis qui vous aide à choisir les meilleurs partenaires pour vos envois.',
    gradient: 'from-success-green to-emerald-400',
    lightBg: 'bg-green-50',
    lightColor: 'text-success-green',
    benefits: [
      { icon: Star, text: 'Notes détaillées après chaque livraison' },
      { icon: BadgeCheck, text: 'Avis vérifiés et authentiques' },
      { icon: Award, text: 'Badges de performance pour les meilleurs' },
      { icon: Users, text: 'Historique complet des transactions' },
    ],
  },
];

const TRUST_BADGES = [
  {
    icon: Award,
    title: 'Recommandé',
    description:
      'Les utilisateurs les plus fiables reçoivent un badge "Recommandé" basé sur leur historique et leurs avis.',
    gradient: 'from-vibrant-orange to-yellow-500',
    lightBg: 'bg-orange-50',
    lightColor: 'text-vibrant-orange',
  },
  {
    icon: BadgeCheck,
    title: 'Vérifié',
    description:
      'Tous les utilisateurs ayant complété la vérification KYC reçoivent le badge "Vérifié" sur leur profil.',
    gradient: 'from-royal-blue to-ocean-blue',
    lightBg: 'bg-blue-50',
    lightColor: 'text-royal-blue',
  },
];

export function SecurityPageClient() {
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
              <ShieldCheck className="w-4 h-4 text-success-green" />
              Votre sécurité, notre priorité
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Sécurité & Confiance
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              Découvrez les mesures de sécurité qui protègent chaque utilisateur et
              chaque transaction sur notre plateforme.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 justify-center mt-10 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success-green" />
                <span>Vérification KYC</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-success-green" />
                <span>Paiement Escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-success-green" />
                <span>Avis Vérifiés</span>
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

        {/* Security Features */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
                Nos garanties
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
                Une protection complète
              </h2>
              <p className="text-body-text text-lg mt-4 max-w-2xl mx-auto">
                Trois piliers de sécurité pour des transactions en toute confiance
              </p>
            </div>

            <div className="space-y-12">
              {SECURITY_FEATURES.map((feature, index) => {
                const FeatureIcon = feature.icon;
                const isReversed = index % 2 === 1;

                return (
                  <div
                    key={index}
                    className="group bg-white rounded-3xl border border-light-border p-8 lg:p-10 hover:shadow-xl hover:border-transparent transition-all duration-300"
                  >
                    <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12`}>
                      {/* Icon + Title */}
                      <div className="shrink-0 lg:w-80">
                        <div
                          className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-105`}
                        >
                          <FeatureIcon className="w-10 h-10 text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-navy mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-body-text leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="flex-1 grid sm:grid-cols-2 gap-4">
                        {feature.benefits.map((benefit, bIndex) => {
                          const BenefitIcon = benefit.icon;
                          return (
                            <div
                              key={bIndex}
                              className={`flex items-start gap-3 rounded-2xl ${feature.lightBg} p-4`}
                            >
                              <div className={`shrink-0 mt-0.5 ${feature.lightColor}`}>
                                <BenefitIcon className="w-5 h-5" />
                              </div>
                              <p className="text-sm text-navy font-medium leading-relaxed">
                                {benefit.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-20 bg-soft-gray">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
                Reconnaissance
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
                Badges de Confiance
              </h2>
              <p className="text-body-text text-lg mt-4 max-w-2xl mx-auto">
                Des badges qui attestent de la fiabilité de chaque utilisateur
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {TRUST_BADGES.map((badge, index) => {
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white rounded-2xl border border-light-border p-8 text-center hover:shadow-xl hover:border-transparent transition-all duration-300"
                  >
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${badge.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform group-hover:scale-110`}
                    >
                      <BadgeIcon className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </div>
                    <h3 className={`text-xl font-heading font-bold ${badge.lightColor} mb-3`}>
                      {badge.title}
                    </h3>
                    <p className="text-body-text leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                );
              })}
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
              Rejoignez notre communauté
            </div>

            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">
              Prêt à essayer en toute sécurité ?
            </h2>
            <p className="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto">
              Rejoignez notre communauté vérifiée et commencez à envoyer ou transporter
              des colis en toute confiance.
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
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 text-white border-white/20 hover:bg-white/15 px-10 py-4 text-base font-semibold"
                >
                  Comment ça marche
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
