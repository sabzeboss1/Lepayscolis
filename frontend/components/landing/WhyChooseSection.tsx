'use client';

import React from 'react';
import { ShieldCheck, Lock, HeartHandshake } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function WhyChooseSection() {
  const { t } = useTranslation();

  const benefits = [
    {
      title: t('home.benefits.safe.title') || 'Utilisateurs Vérifiés KYC',
      description: t('home.benefits.safe.description') || 'Tous nos utilisateurs sont vérifiés avec KYC pour garantir votre sécurité.',
      icon: ShieldCheck,
      gradient: 'from-royal-blue to-ocean-blue',
      lightBg: 'bg-blue-50',
      lightColor: 'text-royal-blue',
    },
    {
      title: t('home.benefits.escrow.title') || 'Paiement Sécurisé Escrow',
      description: t('home.benefits.escrow.description') || 'Votre argent est protégé jusqu\'à la livraison confirmée.',
      icon: Lock,
      gradient: 'from-vibrant-orange to-yellow-500',
      lightBg: 'bg-orange-50',
      lightColor: 'text-vibrant-orange',
    },
    {
      title: t('home.benefits.affordable.title') || 'Transactions Garanties',
      description: t('home.benefits.affordable.description') || 'Protection complète de vos transactions avec support 24/7.',
      icon: HeartHandshake,
      gradient: 'from-success-green to-emerald-400',
      lightBg: 'bg-green-50',
      lightColor: 'text-success-green',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
            {t('home.benefits.badge') || 'Nos avantages'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-4">
            {t('home.benefits.title') || 'Pourquoi choisir Tuma Plus ?'}
          </h2>
          <p className="text-body-text text-lg max-w-2xl mx-auto">
            {t('securityPage.description') || 'Une plateforme conçue pour votre sécurité et votre tranquillité d\'esprit'}
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border border-light-border hover:border-transparent hover:shadow-xl transition-all duration-300"
              >
                {/* Gradient top bar */}
                <div
                  className={`absolute top-0 left-6 right-6 h-1 bg-gradient-to-r ${benefit.gradient} rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                <div
                  className={`w-14 h-14 ${benefit.lightBg} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}
                >
                  <Icon className={`w-7 h-7 ${benefit.lightColor}`} />
                </div>

                <h3 className="text-xl font-heading font-bold text-navy mb-3">
                  {benefit.title}
                </h3>
                <p className="text-body-text leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

