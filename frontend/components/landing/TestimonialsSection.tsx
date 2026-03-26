'use client';

import React from 'react';
import { Star, Quote, BadgeCheck } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Fatou D.',
    location: 'Moscou → Dakar',
    rating: 5,
    text: "Service exceptionnel ! J'ai pu envoyer des cadeaux à ma famille en toute sécurité. Le voyageur était professionnel et ponctuel.",
    avatar: 'fatou',
  },
  {
    name: 'Alexandre P.',
    location: 'Lagos → Saint-Pétersbourg',
    rating: 5,
    text: "Excellente plateforme pour gagner de l'argent pendant mes voyages. Le système de paiement est sécurisé et rapide.",
    avatar: 'alex',
  },
  {
    name: 'Mariam B.',
    location: 'Abidjan → Moscou',
    rating: 5,
    text: 'Je recommande vivement ! Prix abordables et suivi en temps réel. Mon colis est arrivé en parfait état.',
    avatar: 'mariam',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-soft-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3 font-heading">
            Témoignages
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-navy mb-4">
            Ce que disent nos utilisateurs
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <span className="text-xl font-heading font-bold text-navy">
              4.8/5
            </span>
            <span className="text-body-text text-sm">
              basé sur 200+ avis
            </span>
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
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
              <p className="text-body-text leading-relaxed mb-6 italic">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-light-border">
                <img
                  src={`https://i.pravatar.cc/44?u=${testimonial.avatar}`}
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
