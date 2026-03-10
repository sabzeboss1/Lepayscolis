'use client';

import React, { useState } from 'react';
import { HeaderPublic, HeaderApp, Footer } from '@/components/layout';
import { User } from '@/lib/types/user';

export default function LayoutDemoPage() {
  const [showPublicHeader, setShowPublicHeader] = useState(true);

  // Mock user data for HeaderApp
  const mockUser: User = {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: '',
    phone: '+1234567890',
    rating: 4.8,
    completedDeliveries: 12,
    isRecommended: true,
    kycStatus: 'approved',
    createdAt: new Date(),
    locale: 'en',
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toggle Button */}
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={() => setShowPublicHeader(!showPublicHeader)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Toggle: {showPublicHeader ? 'Public' : 'App'} Header
        </button>
      </div>

      {/* Header */}
      {showPublicHeader ? (
        <HeaderPublic locale="en" />
      ) : (
        <HeaderApp user={mockUser} locale="en" unreadMessages={3} />
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Layout Components Demo</h1>
            <p className="text-lg text-gray-600">
              This page demonstrates the HeaderPublic, HeaderApp, and Footer components.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Features Demonstrated</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">HeaderPublic</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Navigation links (Home, How It Works, Security, Destinations, FAQ)</li>
                  <li>Language switcher (FR/EN)</li>
                  <li>Login and Register CTAs</li>
                  <li>Mobile hamburger menu</li>
                  <li>Sticky positioning on scroll</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">HeaderApp</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Navigation links (Dashboard, Trips, Shipments, Messages)</li>
                  <li>Notification badge for unread messages (3 unread in demo)</li>
                  <li>User avatar with dropdown menu</li>
                  <li>Language switcher</li>
                  <li>Mobile hamburger menu</li>
                  <li>Recommended badge display</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Footer</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Company information and links</li>
                  <li>Social media links (Facebook, Twitter, Instagram, LinkedIn)</li>
                  <li>Copyright notice with dynamic year</li>
                  <li>Language switcher</li>
                  <li>Responsive grid layout</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Accessibility Features</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Minimum 44px touch targets for all interactive elements</li>
              <li>Keyboard navigation support with visible focus indicators</li>
              <li>ARIA labels for icon buttons and navigation</li>
              <li>Semantic HTML structure</li>
              <li>Screen reader announcements for dynamic content</li>
              <li>Proper heading hierarchy</li>
            </ul>
          </div>

          <div className="bg-orange-50 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Responsive Design</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Mobile-first approach</li>
              <li>Hamburger menu for mobile devices</li>
              <li>Adaptive layouts for tablet and desktop</li>
              <li>Touch-friendly controls on mobile</li>
              <li>Optimized spacing and typography across breakpoints</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Try It Out</h2>
            <p className="text-gray-700 mb-4">
              Use the toggle button in the top-right corner to switch between HeaderPublic and
              HeaderApp. Try the following:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Click navigation links to see active states</li>
              <li>Toggle the language switcher</li>
              <li>Open the mobile menu (resize your browser to mobile width)</li>
              <li>Click the user avatar in HeaderApp to see the dropdown menu</li>
              <li>Scroll down to see the sticky header behavior</li>
              <li>Check the footer at the bottom of the page</li>
            </ul>
          </div>

          {/* Spacer for scrolling */}
          <div className="h-96"></div>
        </div>
      </main>

      {/* Footer */}
      <Footer locale="en" />
    </div>
  );
}
