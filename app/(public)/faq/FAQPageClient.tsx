'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeaderPublic } from '@/components/layout/HeaderPublic';
import { Footer } from '@/components/layout/Footer';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/config';

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQPageClient() {
  const [locale, setLocale] = useState<Locale>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());
  const { t } = useTranslation(locale);

  const categories = [
    { id: 'general', label: t('faqPage.categories.general') },
    { id: 'senders', label: t('faqPage.categories.senders') },
    { id: 'travelers', label: t('faqPage.categories.travelers') },
    { id: 'payments', label: t('faqPage.categories.payments') },
    { id: 'safety', label: t('faqPage.categories.safety') },
  ];

  const faqData: Record<string, FAQItem[]> = {
    general: [
      {
        question: t('faqPage.general.q1.question'),
        answer: t('faqPage.general.q1.answer'),
      },
      {
        question: t('faqPage.general.q2.question'),
        answer: t('faqPage.general.q2.answer'),
      },
      {
        question: t('faqPage.general.q3.question'),
        answer: t('faqPage.general.q3.answer'),
      },
    ],
    senders: [
      {
        question: t('faqPage.senders.q1.question'),
        answer: t('faqPage.senders.q1.answer'),
      },
      {
        question: t('faqPage.senders.q2.question'),
        answer: t('faqPage.senders.q2.answer'),
      },
      {
        question: t('faqPage.senders.q3.question'),
        answer: t('faqPage.senders.q3.answer'),
      },
    ],
    travelers: [
      {
        question: t('faqPage.travelers.q1.question'),
        answer: t('faqPage.travelers.q1.answer'),
      },
      {
        question: t('faqPage.travelers.q2.question'),
        answer: t('faqPage.travelers.q2.answer'),
      },
      {
        question: t('faqPage.travelers.q3.question'),
        answer: t('faqPage.travelers.q3.answer'),
      },
    ],
    payments: [
      {
        question: t('faqPage.payments.q1.question'),
        answer: t('faqPage.payments.q1.answer'),
      },
      {
        question: t('faqPage.payments.q2.question'),
        answer: t('faqPage.payments.q2.answer'),
      },
      {
        question: t('faqPage.payments.q3.question'),
        answer: t('faqPage.payments.q3.answer'),
      },
    ],
    safety: [
      {
        question: t('faqPage.safety.q1.question'),
        answer: t('faqPage.safety.q1.answer'),
      },
      {
        question: t('faqPage.safety.q2.question'),
        answer: t('faqPage.safety.q2.answer'),
      },
      {
        question: t('faqPage.safety.q3.question'),
        answer: t('faqPage.safety.q3.answer'),
      },
    ],
  };

  const toggleQuestion = (questionId: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId);
    } else {
      newOpenQuestions.add(questionId);
    }
    setOpenQuestions(newOpenQuestions);
  };

  const handleKeyDown = (e: React.KeyboardEvent, questionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleQuestion(questionId);
    }
  };

  const filteredFAQs = () => {
    const items = faqData[activeCategory] || [];
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <SkipToContent />
      <HeaderPublic locale={locale} />

      <main id="main-content" tabIndex={-1} className="py-16 md:py-20 focus:outline-none">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('faqPage.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('faqPage.description')}
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <Input
                type="text"
                label=""
                placeholder={t('faqPage.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center" role="tablist" aria-label="FAQ categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  aria-controls={`${category.id}-panel`}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${
                      activeCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-4" role="tabpanel" id={`${activeCategory}-panel`}>
              {filteredFAQs().length > 0 ? (
                filteredFAQs().map((item, index) => {
                  const questionId = `${activeCategory}-${index}`;
                  const isOpen = openQuestions.has(questionId);

                  return (
                    <Card key={questionId} className="overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(questionId)}
                        onKeyDown={(e) => handleKeyDown(e, questionId)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        aria-expanded={isOpen}
                        aria-controls={`answer-${questionId}`}
                        id={`question-${questionId}`}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 pr-4">
                          {item.question}
                        </h3>
                        <div
                          className={`flex-shrink-0 w-6 h-6 text-blue-600 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        >
                          <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div 
                          id={`answer-${questionId}`}
                          role="region"
                          aria-labelledby={`question-${questionId}`}
                          className="px-6 pb-6 pt-2"
                        >
                          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </Card>
                  );
                })
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">
                    No questions found matching your search.
                  </p>
                </Card>
              )}
            </div>

            {/* Still Have Questions */}
            <div className="mt-16">
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-white text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Still have questions?
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Can't find the answer you're looking for? Our support team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register">
                    <Button variant="primary" size="md">
                      {t('common.getStarted')}
                    </Button>
                  </Link>
                  <Button variant="outline" size="md">
                    {t('common.contactUs')}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
