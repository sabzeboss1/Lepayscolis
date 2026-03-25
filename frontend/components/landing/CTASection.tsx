'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-royal-blue/90 to-navy" />

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-vibrant-orange/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-ocean-blue/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-8 border border-white/10">
          <Sparkles className="w-4 h-4 text-vibrant-orange" />
          Rejoignez notre communauté
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-6 leading-tight">
          Prêt à commencer ?
        </h2>
        <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto">
          Rejoignez des milliers d&apos;utilisateurs qui font confiance à Tuma
          Plus pour leurs envois entre la Russie et l&apos;Afrique.
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
              En savoir plus
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-white/40">
          Inscription gratuite · Aucune carte bancaire requise
        </p>
      </div>
    </section>
  );
}
