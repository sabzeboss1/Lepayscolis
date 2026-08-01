'use client';

import React from 'react';
import { FileText, Handshake, PackageCheck, CircleDollarSign } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function ExperienceSection() {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      title: t('home.howItWorks.senderStep1Title') || 'Publiez',
      description: t('home.howItWorks.senderStep1') || 'Publiez votre annonce de colis ou de voyage en quelques clics',
      icon: FileText,
      color: 'from-royal-blue to-ocean-blue',
    },
    {
      number: 2,
      title: t('home.howItWorks.senderStep2Title') || 'Trouvez un match',
      description: t('home.howItWorks.senderStep2') || 'Trouvez le voyageur ou l\'expéditeur parfait pour votre besoin',
      icon: Handshake,
      color: 'from-vibrant-orange to-yellow-500',
    },
    {
      number: 3,
      title: t('home.howItWorks.senderStep3Title') || 'Expédiez',
      description: t('home.howItWorks.senderStep3') || 'Remettez ou récupérez le colis en toute sécurité',
      icon: PackageCheck,
      color: 'from-success-green to-emerald-400',
    },
    {
      number: 4,
      title: t('home.howItWorks.travelerStep3Title') || 'Livré !',
      description: t('home.howItWorks.travelerStep3') || 'Confirmez la livraison et le paiement est libéré',
      icon: CircleDollarSign,
      color: 'from-purple-500 to-violet-400',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-soft-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
            {t('home.howItWorks.badge') || 'Simple et rapide'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy">
            {t('home.howItWorks.title') || 'Comment ça fonctionne'}
          </h2>
        </div>

        {/* Desktop Steps */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 relative">
          {/* Connection line */}
          <div className="absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-royal-blue via-vibrant-orange to-purple-500 opacity-20" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center relative z-10">
                <div
                  className={`w-28 h-28 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform hover:scale-105`}
                >
                  <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
                </div>
                <div className="w-8 h-8 bg-white border-[3px] border-navy rounded-full flex items-center justify-center text-navy font-heading font-bold text-sm mx-auto mb-4 shadow-sm">
                  {step.number}
                </div>
                <h3 className="text-lg font-heading font-bold text-navy mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-body-text leading-relaxed max-w-[220px] mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile Steps */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-start gap-5">
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-8 bg-light-border mt-2" />
                  )}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-text font-heading">
                      {t('common.step') || 'ÉTAPE'} {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-bold text-navy mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-body-text leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

