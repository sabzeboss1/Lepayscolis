import React from 'react';
import type { Metadata } from 'next';
import { HowItWorksPageClient } from './HowItWorksPageClient';

export const metadata: Metadata = {
  title: 'Comment ça marche - Tuma Plus',
  description:
    'Découvrez comment Tuma Plus connecte expéditeurs et voyageurs pour une livraison sûre et abordable entre la Russie et l\'Afrique.',
  openGraph: {
    title: 'Comment ça marche - Tuma Plus',
    description:
      'Guide étape par étape pour les expéditeurs et les voyageurs',
    type: 'website',
  },
};

export default function HowItWorksPage() {
  return <HowItWorksPageClient />;
}
