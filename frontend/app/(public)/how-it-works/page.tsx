import React from 'react';
import type { Metadata } from 'next';
import { HowItWorksPageClient } from './HowItWorksPageClient';

export const metadata: Metadata = {
  title: 'How It Works - LePaysExpressColis',
  description: 'Learn how LePaysExpressColis connects senders and travelers for safe, affordable parcel delivery between Russia and Africa.',
  openGraph: {
    title: 'How It Works - LePaysExpressColis',
    description: 'Step-by-step guide for senders and travelers',
    type: 'website',
  },
};

export default function HowItWorksPage() {
  return <HowItWorksPageClient />;
}
