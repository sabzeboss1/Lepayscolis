import React from 'react';
import type { Metadata } from 'next';
import { SecurityPageClient } from './SecurityPageClient';

export const metadata: Metadata = {
  title: 'Sécurité & Confiance - Tuma Plus',
  description:
    'Découvrez nos mesures de sécurité : vérification KYC, paiement escrow sécurisé et système de notation pour des livraisons en toute confiance.',
  openGraph: {
    title: 'Sécurité & Confiance - Tuma Plus',
    description: 'Votre sécurité est notre priorité',
    type: 'website',
  },
};

export default function SecurityPage() {
  return <SecurityPageClient />;
}
