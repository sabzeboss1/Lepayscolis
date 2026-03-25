'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Package,
  Plane,
  CreditCard,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/Button';

interface FAQItem {
  question: string;
  answer: string;
}

const CATEGORIES = [
  { id: 'general', label: 'Général', icon: HelpCircle },
  { id: 'senders', label: 'Expéditeurs', icon: Package },
  { id: 'travelers', label: 'Voyageurs', icon: Plane },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'safety', label: 'Sécurité', icon: ShieldCheck },
];

const FAQ_DATA: Record<string, FAQItem[]> = {
  general: [
    {
      question: 'Qu\'est-ce que Tuma Plus ?',
      answer:
        'Tuma Plus est une plateforme communautaire qui connecte les expéditeurs avec des voyageurs de confiance pour le transport de colis entre la Russie et l\'Afrique. Nous offrons une solution sûre, abordable et fiable pour l\'envoi de vos colis.',
    },
    {
      question: 'Comment fonctionne la plateforme ?',
      answer:
        'C\'est simple : les expéditeurs publient leurs demandes d\'envoi de colis, les voyageurs proposent leur espace bagage disponible, et notre plateforme facilite la mise en relation. Le paiement est sécurisé via notre système d\'escrow.',
    },
    {
      question: 'Dans quels pays opérez-vous ?',
      answer:
        'Nous opérons principalement entre la Russie (Moscou, Saint-Pétersbourg, Kazan, Sotchi) et l\'Afrique (Sénégal, Côte d\'Ivoire, Nigeria, Kenya, Afrique du Sud, Maroc, Égypte, Éthiopie). De nouvelles destinations sont ajoutées régulièrement.',
    },
  ],
  senders: [
    {
      question: 'Comment envoyer un colis ?',
      answer:
        'Créez un compte, publiez votre demande d\'envoi en précisant la destination, le poids et les dimensions du colis. Trouvez un voyageur disponible, effectuez le paiement sécurisé et remettez votre colis au voyageur.',
    },
    {
      question: 'Quels types de colis puis-je envoyer ?',
      answer:
        'Vous pouvez envoyer la plupart des articles personnels et cadeaux. Les articles interdits incluent les substances illégales, les matières dangereuses, les aliments périssables et tout ce qui enfreint les réglementations douanières.',
    },
    {
      question: 'Comment est calculé le prix ?',
      answer:
        'Le prix est fixé par le voyageur et dépend du poids, de la destination et de la date de livraison. En moyenne, nos prix sont 50 à 70% moins chers que les services de transport traditionnels.',
    },
  ],
  travelers: [
    {
      question: 'Comment devenir voyageur ?',
      answer:
        'Inscrivez-vous sur la plateforme, complétez la vérification KYC, puis publiez votre voyage avec les détails de votre itinéraire et l\'espace disponible dans vos bagages.',
    },
    {
      question: 'Combien puis-je gagner ?',
      answer:
        'Les gains varient selon la route et le poids transporté. En moyenne, les voyageurs gagnent entre 50€ et 200€ par voyage. Vous fixez vos propres prix.',
    },
    {
      question: 'Quelles sont mes obligations ?',
      answer:
        'Vous devez transporter les colis avec soin, respecter les délais convenus et confirmer la livraison via l\'application. Vous êtes responsable des colis acceptés jusqu\'à la livraison.',
    },
  ],
  payments: [
    {
      question: 'Comment fonctionne le paiement ?',
      answer:
        'Le paiement est sécurisé via notre système d\'escrow. L\'expéditeur paie lors de la réservation, les fonds sont bloqués, et le paiement est libéré au voyageur une fois la livraison confirmée.',
    },
    {
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer:
        'Nous acceptons les cartes bancaires (Visa, Mastercard), les virements bancaires et les portefeuilles électroniques. Les paiements sont traités de manière sécurisée via Stripe.',
    },
    {
      question: 'Que se passe-t-il en cas de litige ?',
      answer:
        'En cas de litige, notre équipe de support intervient pour médier. Les fonds restent bloqués en escrow jusqu\'à la résolution. Si le colis est perdu ou endommagé, l\'expéditeur est intégralement remboursé.',
    },
  ],
  safety: [
    {
      question: 'Comment vérifiez-vous les utilisateurs ?',
      answer:
        'Tous les utilisateurs doivent passer une vérification KYC complète incluant la vérification d\'identité, la validation de documents officiels et la vérification de l\'adresse. Seuls les profils vérifiés peuvent effectuer des transactions.',
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer:
        'Oui, nous utilisons le chiffrement de bout en bout pour protéger vos données personnelles. Nos serveurs sont conformes aux normes RGPD et nous ne partageons jamais vos informations avec des tiers.',
    },
    {
      question: 'Que faire en cas de problème ?',
      answer:
        'Contactez immédiatement notre support via l\'application, par email ou via WhatsApp. Notre équipe est disponible 24/7 pour vous aider à résoudre tout problème.',
    },
  ],
};

export function FAQPageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = useCallback((questionId: string) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const filteredFAQs = useMemo(() => {
    const items = FAQ_DATA[activeCategory] || [];
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-royal-blue to-ocean-blue pt-32 pb-20 sm:pt-36 sm:pb-24">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-[-5%] top-16 h-48 w-48 rounded-full bg-vibrant-orange blur-3xl" />
            <div className="absolute right-[-10%] bottom-0 h-72 w-72 rounded-full bg-white blur-3xl" />
          </div>
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm font-medium mb-8 border border-white/15 backdrop-blur-sm">
              <HelpCircle className="w-4 h-4 text-vibrant-orange" />
              Centre d&apos;aide
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Questions Fréquentes
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed mb-10">
              Trouvez rapidement les réponses à toutes vos questions sur notre plateforme.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-colors"
                aria-label="Rechercher dans la FAQ"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
              <path
                d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-12 justify-center" role="tablist" aria-label="Catégories FAQ">
              {CATEGORIES.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    role="tab"
                    aria-selected={activeCategory === category.id}
                    aria-controls={`${category.id}-panel`}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue focus-visible:ring-offset-2 ${
                      activeCategory === category.id
                        ? 'bg-royal-blue text-white shadow-lg shadow-blue-500/20'
                        : 'bg-soft-gray text-body-text hover:bg-blue-50 hover:text-royal-blue'
                    }`}
                  >
                    <CategoryIcon className="w-4 h-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>

            {/* FAQ Items */}
            <div
              className="space-y-4 max-w-3xl mx-auto"
              role="tabpanel"
              id={`${activeCategory}-panel`}
            >
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((item, index) => {
                  const questionId = `${activeCategory}-${index}`;
                  const isOpen = openQuestions.has(questionId);

                  return (
                    <div
                      key={questionId}
                      className="bg-white rounded-2xl border border-light-border overflow-hidden hover:border-royal-blue/20 transition-colors"
                    >
                      <button
                        onClick={() => toggleQuestion(questionId)}
                        className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue focus-visible:ring-inset"
                        aria-expanded={isOpen}
                        aria-controls={`answer-${questionId}`}
                        id={`question-${questionId}`}
                      >
                        <h3 className="text-base font-heading font-semibold text-navy pr-4">
                          {item.question}
                        </h3>
                        <div
                          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                            isOpen
                              ? 'bg-royal-blue text-white rotate-180'
                              : 'bg-soft-gray text-muted-text'
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      <div
                        id={`answer-${questionId}`}
                        role="region"
                        aria-labelledby={`question-${questionId}`}
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-6 pt-0">
                          <div className="bg-soft-gray rounded-xl p-4">
                            <p className="text-body-text leading-relaxed text-sm">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-soft-gray rounded-2xl">
                  <Search className="w-12 h-12 text-muted-text mx-auto mb-4" />
                  <p className="text-navy font-heading font-semibold mb-2">
                    Aucune question trouvée
                  </p>
                  <p className="text-body-text text-sm">
                    Essayez un autre terme de recherche ou changez de catégorie.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-20 bg-soft-gray">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl border border-light-border p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
                    Besoin d&apos;aide ?
                  </p>
                  <h2 className="text-3xl font-heading font-bold text-navy mb-4">
                    Vous n&apos;avez pas trouvé votre réponse ?
                  </h2>
                  <p className="text-body-text leading-relaxed">
                    Notre équipe de support est disponible 24/7 pour répondre à toutes
                    vos questions et vous accompagner dans votre expérience.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                  <a
                    href="https://wa.me/33123456789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-success-green/10 text-success-green rounded-2xl font-semibold hover:bg-success-green/20 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contacter via WhatsApp
                  </a>
                  <Link href="/auth/register">
                    <Button
                      size="lg"
                      fullWidth
                      className="bg-royal-blue hover:bg-ocean-blue text-white font-semibold gap-2 group"
                    >
                      Créer un compte
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-royal-blue/90 to-navy" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-vibrant-orange/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-ocean-blue/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-8 border border-white/10">
              <Sparkles className="w-4 h-4 text-vibrant-orange" />
              Rejoignez notre communauté
            </div>

            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto">
              Rejoignez des milliers d&apos;utilisateurs qui font confiance à Tuma Plus
              pour leurs envois entre la Russie et l&apos;Afrique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-vibrant-orange hover:bg-warm-orange text-white px-10 py-4 text-base font-bold shadow-xl shadow-orange-500/30 border-0 gap-2 group"
                >
                  Créer un Compte Gratuit
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 text-white border-white/20 hover:bg-white/15 px-10 py-4 text-base font-semibold"
                >
                  Comment ça marche
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
