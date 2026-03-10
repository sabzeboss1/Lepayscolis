'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeaderPublic } from '@/components/layout/HeaderPublic';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/config';

export function SecurityPageClient() {
  const [locale, setLocale] = useState<Locale>('en');
  const { t } = useTranslation(locale);

  return (
    <div className="min-h-screen bg-white">
      <HeaderPublic locale={locale} />

      <main className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('securityPage.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('securityPage.description')}
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-12">
            {/* KYC Verification */}
            <Card className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 text-center md:text-left">
                  <div className="text-6xl mb-4">🛡️</div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-blue-600 mb-4">
                    {t('securityPage.kyc.title')}
                  </h2>
                  <p className="text-lg text-gray-700 mb-6">
                    {t('securityPage.kyc.description')}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(t('securityPage.kyc.benefits') as unknown as string[]).map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          ✓
                        </div>
                        <p className="text-gray-700">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Escrow Payment System */}
            <Card className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 text-center md:text-left">
                  <div className="text-6xl mb-4">💳</div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-blue-600 mb-4">
                    {t('securityPage.escrow.title')}
                  </h2>
                  <p className="text-lg text-gray-700 mb-6">
                    {t('securityPage.escrow.description')}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(t('securityPage.escrow.benefits') as unknown as string[]).map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          ✓
                        </div>
                        <p className="text-gray-700">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Rating & Review System */}
            <Card className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 text-center md:text-left">
                  <div className="text-6xl mb-4">⭐</div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-blue-600 mb-4">
                    {t('securityPage.ratings.title')}
                  </h2>
                  <p className="text-lg text-gray-700 mb-6">
                    {t('securityPage.ratings.description')}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(t('securityPage.ratings.benefits') as unknown as string[]).map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          ✓
                        </div>
                        <p className="text-gray-700">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Trust Badges */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 md:p-10 rounded-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                {t('securityPage.trust.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6 text-center">
                  <div className="text-5xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold text-orange-600 mb-3">
                    Recommended
                  </h3>
                  <p className="text-gray-700">
                    {t('securityPage.trust.recommended')}
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-blue-600 mb-3">
                    Verified
                  </h3>
                  <p className="text-gray-700">
                    {t('securityPage.trust.verified')}
                  </p>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to experience safe delivery?
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Join our trusted community today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button variant="primary" size="lg">
                    {t('common.getStarted')}
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg">
                    {t('common.learnMore')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
