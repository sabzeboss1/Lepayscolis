import React from 'react';
import type { Metadata } from 'next';
import { DestinationsPageClient } from './DestinationsPageClient';

export const metadata: Metadata = {
  title: 'Destinations Populaires - Tuma Plus',
  description:
    'Explorez les routes populaires entre la Russie et l\'Afrique. Trouvez des voyageurs et expéditeurs connectant Moscou, Saint-Pétersbourg, Dakar, Lagos et plus.',
  openGraph: {
    title: 'Destinations Populaires - Tuma Plus',
    description: 'Connecter la Russie et l\'Afrique',
    type: 'website',
  },
};

export default function DestinationsPage() {
  return <DestinationsPageClient />;
}
