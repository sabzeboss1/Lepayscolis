'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeaderPublic } from '@/components/layout/HeaderPublic';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/config';

export function HowItWorksPageClient() {
  const [locale, setLocale] = useState<Locale>('en');
  const [activeTab, setActiveTab] = useState<'send' | 'travel'>('send');
  const { t } = useTranslation(locale);

  return (
    <div className="min-h-screen bg-white">
      <HeaderPublic locale={locale} />

      <main className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('howItWorksPage.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('howItWorksPage.description')}
            </p>
          </div>

          {/* Tabs */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('send')}
                className={`
                  flex-1 py-4 px-6 text-lg font-semibold transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-md
                  ${
                    activeTab === 'send'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
                aria-selected={activeTab === 'send'}
                role="tab"
              >
                {t('howItWorksPage.tabs.send')}
              </button>
              <button
                onClick={() => setActiveTab('travel')}
                className={`
                  flex-1 py-4 px-6 text-lg font-semibold transition-colors
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-t-md
                  ${
                    activeTab === 'travel'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
                aria-selected={activeTab === 'travel'}
                role="tab"
              >
                {t('howItWorksPage.tabs.travel')}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl mx-auto" role="tabpanel">
            {activeTab === 'send' ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-blue-600 text-center mb-8">
                  {t('howItWorksPage.sender.title')}
                </h2>

                {/* Step 1 */}
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {t('howItWorksPage.sender.step1.title')}
                      </h3>
                      <p className="text-lg text-gray-700 mb-4">
                        {t('howItWorksPage.sender.step1.description')}
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-5xl mb-2 text-center">🔍</div>
                        <p className="text-sm text-gray-600 text-center">
                          Use our search filters to find the perfect traveler
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Step 2 */}
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        2
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {t('howItWorksPage.sender.step2.title')}
                      </h3>
                      <p className="text-lg text-gray-700 mb-4">
                        {t('howItWorksPage.sender.step2.description')}
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-5xl mb-2 text-center">💳</div>
                        <p className="text-sm text-gray-600 text-center">
                          Your payment is held safely in escrow until delivery
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Step 3 */}
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        3
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {t('howItWorksPage.sender.step3.title')}
                      </h3>
                      <p className="text-lg text-gray-700 mb-4">
                        {t('howItWorksPage.sender.step3.description')}
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-5xl mb-2 text-center">📦</div>
                        <p className="text-sm text-gray-600 text-center">
                          Stay updated with real-time delivery status
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="text-center mt-8">
                  <Link href="/auth/register">
                    <Button variant="primary" size="lg">
                      {t('common.getStarted')}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-orange-600 text-center mb-8">
                  {t('howItWorksPage.traveler.title')}
                </h2>

                {/* Step 1 */}
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {t('howItWorksPage.traveler.step1.title')}
                      </h3>
                      <p className="text-lg text-gray-700 mb-4">
                        {t('howItWorksPage.traveler.step1.description')}
                      </p>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-5xl mb-2 text-center">✈️</div>
                        <p className="text-sm text-gray-600 text-center">
                          Share your travel plans and available luggage space
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Step 2 */}
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        2
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {t('howItWorksPage.traveler.step2.title')}
                      </h3>
                      <p className="text-lg text-gray-700 mb-4">
                        {t('howItWorksPage.traveler.step2.description')}
                      </p>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-5xl mb-2 text-center">✅</div>
                        <p className="text-sm text-gray-600 text-center">
                          Choose requests that match your trip
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Step 3 */}
                <Card className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        3
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {t('howItWorksPage.traveler.step3.title')}
                      </h3>
                      <p className="text-lg text-gray-700 mb-4">
                        {t('howItWorksPage.traveler.step3.description')}
                      </p>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-5xl mb-2 text-center">💰</div>
                        <p className="text-sm text-gray-600 text-center">
                          Payment released automatically after confirmation
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="text-center mt-8">
                  <Link href="/auth/register">
                    <Button variant="primary" size="lg" className="bg-orange-500 hover:bg-orange-600">
                      {t('common.getStarted')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="p-8 bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Ready to get started?
              </h3>
              <p className="text-lg text-gray-700 text-center mb-6">
                Join thousands of users connecting Russia and Africa through our trusted platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/security">
                  <Button variant="outline" size="md">
                    Learn About Security
                  </Button>
                </Link>
                <Link href="/faq">
                  <Button variant="outline" size="md">
                    Read FAQ
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
