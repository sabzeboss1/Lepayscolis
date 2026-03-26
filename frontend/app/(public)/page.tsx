'use client';

import React from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProofSection } from '@/components/landing/ProofSection';
import { ExperienceSection } from '@/components/landing/ExperienceSection';
import { WhyChooseSection } from '@/components/landing/WhyChooseSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PopularDestinationsSection } from '@/components/landing/PopularDestinationsSection';
import { CTASection } from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <main>
        <HeroSection />
        <ProofSection />
        <ExperienceSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <PopularDestinationsSection />
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
