import React from 'react';
import type { Metadata } from 'next';
import { DestinationsPageClient } from './DestinationsPageClient';

export const metadata: Metadata = {
  title: 'Popular Destinations - LePaysExpressColis',
  description: 'Explore popular routes between Russia and Africa. Find travelers and senders connecting Moscow, St. Petersburg, Cairo, Lagos, and more.',
  openGraph: {
    title: 'Popular Destinations - LePaysExpressColis',
    description: 'Connecting Russia and Africa',
    type: 'website',
  },
};

export default function DestinationsPage() {
  return <DestinationsPageClient />;
}
