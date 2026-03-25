'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/Button';

type HeroStat = {
  value: string;
  label: string;
};

type FeatureCard = {
  eyebrow?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

type HighlightCard = {
  title: string;
  description: string;
};

type CTAConfig = {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

type MarketingPageShellProps = {
  badge: string;
  title: string;
  description: string;
  heroNote: string;
  heroStats: HeroStat[];
  heroAsideTitle: string;
  heroAsideItems: string[];
  featureTitle: string;
  featureDescription: string;
  featureCards: FeatureCard[];
  highlightTitle: string;
  highlightDescription: string;
  highlights: HighlightCard[];
  cta: CTAConfig;
  children?: React.ReactNode;
};

export function MarketingPageShell({
  badge,
  title,
  description,
  heroNote,
  heroStats,
  heroAsideTitle,
  heroAsideItems,
  featureTitle,
  featureDescription,
  featureCards,
  highlightTitle,
  highlightDescription,
  highlights,
  cta,
  children,
}: MarketingPageShellProps) {
  return (
    <div className="min-h-screen bg-white text-navy">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-royal-blue to-ocean-blue pt-32 pb-20 sm:pt-36 sm:pb-24">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-[-5%] top-16 h-48 w-48 rounded-full bg-vibrant-orange blur-3xl" />
            <div className="absolute right-[-10%] bottom-0 h-72 w-72 rounded-full bg-white blur-3xl" />
            <div className="absolute left-1/3 top-1/2 h-32 w-32 rounded-full bg-sky-300 blur-2xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                {badge}
              </span>

              <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                {description}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href={cta.primaryHref}>
                  <Button
                    size="lg"
                    className="w-full bg-vibrant-orange text-white shadow-lg shadow-orange-500/30 hover:bg-warm-orange sm:w-auto"
                  >
                    {cta.primaryLabel}
                  </Button>
                </Link>

                {cta.secondaryLabel && cta.secondaryHref ? (
                  <Link href={cta.secondaryHref}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
                    >
                      {cta.secondaryLabel}
                    </Button>
                  </Link>
                ) : null}
              </div>

              <p className="mt-6 text-sm font-medium uppercase tracking-[0.24em] text-white/60">
                {heroNote}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
                  >
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-navy/20 backdrop-blur-md sm:p-8">
              <div className="rounded-3xl bg-white p-6 sm:p-8">
                <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-royal-blue">
                  Aperçu rapide
                </div>
                <h2 className="mt-4 font-heading text-2xl font-bold text-navy">
                  {heroAsideTitle}
                </h2>

                <div className="mt-6 space-y-4">
                  {heroAsideItems.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-soft-gray p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-green" />
                      <p className="text-sm leading-6 text-body-text">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-gradient-to-r from-vibrant-orange to-warm-orange p-[1px]">
                  <div className="rounded-2xl bg-white px-5 py-4">
                    <p className="text-sm font-semibold text-navy">
                      Un parcours inspiré du design de l'accueil, optimisé pour mobile et desktop.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-royal-blue">
                Ce que vous trouvez sur cette page
              </span>
              <h2 className="mt-6 font-heading text-3xl font-bold text-navy sm:text-4xl">
                {featureTitle}
              </h2>
              <p className="mt-4 text-lg leading-8 text-body-text">
                {featureDescription}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((card) => (
                <article
                  key={card.title}
                  className="group rounded-3xl border border-light-border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-royal-blue transition-colors group-hover:bg-orange-50 group-hover:text-vibrant-orange">
                    {card.icon}
                  </div>

                  {card.eyebrow ? (
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-vibrant-orange">
                      {card.eyebrow}
                    </p>
                  ) : null}

                  <h3 className="mt-3 font-heading text-2xl font-bold text-navy">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-body-text">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {children}

        <section className="bg-soft-gray py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div>
                <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-royal-blue shadow-sm">
                  Informations essentielles
                </span>
                <h2 className="mt-6 font-heading text-3xl font-bold text-navy sm:text-4xl">
                  {highlightTitle}
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-8 text-body-text">
                  {highlightDescription}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {highlights.map((highlight) => (
                  <article
                    key={highlight.title}
                    className="rounded-3xl border border-white bg-white p-6 shadow-sm"
                  >
                    <h3 className="font-heading text-xl font-bold text-navy">
                      {highlight.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-body-text">
                      {highlight.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-navy via-royal-blue to-ocean-blue p-8 shadow-2xl shadow-blue-900/10 sm:p-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                    Passez à l'action
                  </span>
                  <h2 className="mt-5 font-heading text-3xl font-bold text-white sm:text-4xl">
                    {cta.title}
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-white/75">
                    {cta.description}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                  <Link href={cta.primaryHref}>
                    <Button
                      size="lg"
                      className="w-full bg-vibrant-orange text-white hover:bg-warm-orange"
                    >
                      <span>{cta.primaryLabel}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  {cta.secondaryLabel && cta.secondaryHref ? (
                    <Link href={cta.secondaryHref}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full border-white/30 bg-white/10 text-white hover:bg-white/15"
                      >
                        {cta.secondaryLabel}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
