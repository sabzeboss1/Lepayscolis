import React from 'react';
import type { Metadata } from 'next';
import { SecurityPageClient } from './SecurityPageClient';

export const metadata: Metadata = {
  title: 'Security & Trust - LePaysExpressColis',
  description: 'Learn about our KYC verification, escrow payment system, and rating system that keeps your deliveries safe and secure.',
  openGraph: {
    title: 'Security & Trust - LePaysExpressColis',
    description: 'Your safety is our priority',
    type: 'website',
  },
};

export default function SecurityPage() {
  return <SecurityPageClient />;
}
