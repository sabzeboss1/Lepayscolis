'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Card,
  RatingStars,
  LanguageSwitcher,
  UserCard,
  TripCard,
  Timeline,
  TimelineStep,
} from '@/components/ui';
import { User } from '@/lib/types/user';
import { Trip } from '@/lib/types/trip';
import { Locale } from '@/lib/i18n/config';

export default function ComponentsDemo() {
  const [locale, setLocale] = useState<Locale>('fr');
  const [rating, setRating] = useState(3.5);
  const [inputValue, setInputValue] = useState('');

  const mockUser: User = {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    phone: '+1234567890',
    rating: 4.8,
    completed_deliveries: 12,
    is_recommended: true,
    kyc_status: 'approved',
    role: 'user',
    currency_code: 'EUR',
    locale: 'fr',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockTrip: Trip = {
    id: '1',
    traveler_id: '1',
    traveler: mockUser,
    departure_city: 'Moscow',
    departure_country: 'Russia',
    departure_date: '2025-02-15T00:00:00.000Z',
    arrival_city: 'Dakar',
    arrival_country: 'Senegal',
    arrival_date: '2025-02-20T00:00:00.000Z',
    available_capacity: 15,
    price_per_kg: 12.5,
    accepted_package_types: [],
    pickup_address: '',
    delivery_address: '',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const timelineSteps: TimelineStep[] = [
    {
      id: '1',
      label: 'Package picked up',
      status: 'completed',
      date: new Date('2025-01-10') as any,
    },
    {
      id: '2',
      label: 'In transit',
      status: 'current',
      date: new Date('2025-01-15') as any,
    },
    {
      id: '3',
      label: 'Delivered',
      status: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <h1 className="text-4xl font-bold text-gray-900">Components Demo</h1>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Inputs</h2>
          <div className="space-y-4 max-w-md">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value=""
              onChange={() => {}}
              required
            />
            <Input
              label="Error Example"
              type="text"
              value=""
              onChange={() => {}}
              error="This field is required"
            />
            <Input
              label="With Helper Text"
              type="text"
              value=""
              onChange={() => {}}
              helperText="This is some helpful information"
            />
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <h3 className="font-semibold mb-2">Default Card</h3>
              <p className="text-gray-600">This is a default card with shadow.</p>
            </Card>
            <Card variant="elevated">
              <h3 className="font-semibold mb-2">Elevated Card</h3>
              <p className="text-gray-600">This card has more elevation.</p>
            </Card>
            <Card variant="outlined" hoverable>
              <h3 className="font-semibold mb-2">Outlined Hoverable</h3>
              <p className="text-gray-600">Hover over this card!</p>
            </Card>
          </div>
        </section>

        {/* Rating Stars */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Rating Stars</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Display mode:</p>
              <RatingStars rating={4.5} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Interactive mode (current: {rating}):</p>
              <RatingStars rating={rating} interactive onChange={setRating} />
            </div>
            <div className="flex gap-4">
              <RatingStars rating={3.5} size="sm" />
              <RatingStars rating={3.5} size="md" />
              <RatingStars rating={3.5} size="lg" />
            </div>
          </div>
        </section>

        {/* Language Switcher */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Language Switcher</h2>
          <LanguageSwitcher currentLocale={locale} onLocaleChange={setLocale} />
          <p className="mt-2 text-sm text-gray-600">Current locale: {locale}</p>
        </section>

        {/* User Card */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">User Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UserCard user={mockUser} />
            <UserCard
              user={mockUser}
              showContactButton
              onContactClick={() => alert('Contact clicked!')}
            />
            <UserCard
              user={{ ...mockUser, is_recommended: false, kyc_status: 'pending' } as any}
            />
          </div>
        </section>

        {/* Trip Card */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Trip Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TripCard trip={mockTrip} onClick={() => alert('Trip clicked!')} />
            <TripCard
              trip={{
                ...mockTrip,
                traveler: { ...mockUser, is_recommended: false },
              }}
            />
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Timeline</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Vertical (Mobile)</h3>
              <Timeline steps={timelineSteps} orientation="vertical" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Horizontal (Desktop)</h3>
              <Timeline steps={timelineSteps} orientation="horizontal" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
