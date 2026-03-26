import React from 'react';
import type { Metadata } from 'next';
import { FAQPageClient } from './FAQPageClient';

export const metadata: Metadata = {
  title: 'FAQ - Tuma Plus',
  description:
    'Trouvez les réponses à vos questions sur l\'envoi de colis, les voyages, les paiements et la sécurité sur Tuma Plus.',
  openGraph: {
    title: 'FAQ - Tuma Plus',
    description: 'Questions Fréquentes',
    type: 'website',
  },
};

export default function FAQPage() {
  return <FAQPageClient />;
}
