import React from 'react';
import type { Metadata } from 'next';
import { FAQPageClient } from './FAQPageClient';

export const metadata: Metadata = {
  title: 'FAQ - LePaysExpressColis',
  description: 'Find answers to frequently asked questions about sending packages, traveling with packages, payments, and safety on LePaysExpressColis.',
  openGraph: {
    title: 'FAQ - LePaysExpressColis',
    description: 'Frequently Asked Questions',
    type: 'website',
  },
};

export default function FAQPage() {
  return <FAQPageClient />;
}
