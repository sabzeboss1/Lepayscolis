'use client';

import React, { useState, useEffect } from 'react';
import { Star, Quote, BadgeCheck } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Fallback testimonials if API fails
const FALLBACK_TESTIMONIALS = [
  {
    name: 'Fatou D.',
    location: 'Moscou → Dakar',
    rating: 5,
    comment: "Service exceptionnel ! J'ai pu envoyer des cadeaux à ma famille en toute sécurité. Le voyageur était professionnel et ponctuel.",
    avatar: null,
  },
  {
    name: 'Alexandre P.',
    location: 'Lagos → Saint-Pétersbourg',
    rating: 5,
    comment: "Excellente plateforme pour gagner de l'argent pendant mes voyages. Le système de paiement est sécurisé et rapide.",
    avatar: null,
  },
  {
    name: 'Mariam B.',
    location: 'Abidjan → Moscou',
    rating: 5,
    comment: 'Je recommande vivement ! Prix abordables et suivi en temps réel. Mon colis est arrivé en parfait état.',
    avatar: null,
  },
];

interface Testimonial {
  id?: number;
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar?: string | null;
}

interface TestimonialStats {
  average_rating: number;
  total_ratings: number;
}

export function TestimonialsSection() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);
  const [stats, setStats] = useState<TestimonialStats>({
    average_rating: 4.8,
    total_ratings: 200,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await apiClient.get<{ 
        data: Testimonial[]; 
        stats?: TestimonialStats 
      }>('/api/testimonials');
      
      if (response.data && response.data.length > 0) {
        setTestimonials(response.data);
      }
      
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.log('Using fallback testimonials:', error);
      // Keep fallback data
    }
  };

  // Generate avatar URL
  const getAvatarUrl = (testimonial: Testimonial, index: number) => {
    if (testimonial.avatar) {
      return testimonial.avatar;
    }
    const avatars = [
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
    ];
    return avatars[index % avatars.length];
  };

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
            {t('home.testimonials.badge') || 'Témoignages'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-4">
            {t('home.testimonials.title') || 'Ce que disent nos utilisateurs'}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(stats.average_rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xl font-heading font-bold text-navy">
              {stats.average_rating}/5
            </span>
            <span className="text-body-text text-sm">
              {t('home.testimonials.basedOn') || 'basé sur'} {stats.total_ratings}+ {t('home.testimonials.reviews') || 'avis'}
            </span>
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div
              key={testimonial.id || index}
              className="bg-white rounded-2xl p-6 lg:p-8 border border-light-border hover:shadow-lg transition-all duration-300 relative"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-royal-blue/10 absolute top-6 right-6" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-body-text leading-relaxed mb-6 italic line-clamp-4">
                &ldquo;{testimonial.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-light-border">
                <img
                  src={getAvatarUrl(testimonial, index)}
                  alt={testimonial.name}
                  className="w-11 h-11 rounded-full object-cover"
                  width={44}
                  height={44}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-heading font-semibold text-navy text-sm">
                      {testimonial.name}
                    </h4>
                    <BadgeCheck className="w-4 h-4 text-royal-blue" />
                  </div>
                  <p className="text-xs text-muted-text">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
