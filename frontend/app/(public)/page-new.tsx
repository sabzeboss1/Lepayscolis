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

export default function NewLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      
      <main>
        {/* Hero Section avec image d'aéroport */}
        <HeroSection />

        {/* Proof Section - Stats */}
        <ProofSection />

        {/* L'Expérience en 4 Étapes */}
        <ExperienceSection />

        {/* Why Choose Section */}
        <WhyChooseSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Popular Destinations */}
        <PopularDestinationsSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
