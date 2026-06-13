'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { usePlatformBranding } from '@/lib/hooks/usePlatformBranding';

const FOOTER_LINKS = {
  'À propos': [
    { label: 'Notre histoire', href: '/about' },
    { label: "L'équipe", href: '/team' },
    { label: 'Carrières', href: '/careers' },
    { label: 'Presse', href: '/press' },
  ],
  Aide: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Comment ça marche', href: '/how-it-works' },
    { label: 'Sécurité', href: '/security' },
    { label: 'Support', href: '/support' },
  ],
  Légal: [
    { label: 'Conditions', href: '/terms' },
    { label: 'Confidentialité', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Mentions légales', href: '/legal' },
  ],
};

export function LandingFooter() {
  const branding = usePlatformBranding();
  
  // Defensive defaults
  const logo_url = branding?.logo_url || '/logo.png';
  const contact_email = branding?.contact_email || 'contact@tumaplus.com';
  const contact_phone = branding?.contact_phone || '+7 960 566 10 05';
  const contact_address = branding?.contact_address || 'Moscou, Russie';
  const whatsapp_number = branding?.whatsapp_number || '79605661005';
  const facebook_url = branding?.facebook_url || '#';
  const twitter_url = branding?.twitter_url || '#';
  const instagram_url = branding?.instagram_url || '#';
  const linkedin_url = branding?.linkedin_url || '#';

  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-5">
              <img
                src={logo_url}
                alt="Tuma Plus"
                className="h-10 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-6">
              Plateforme communautaire de transport de colis entre la Russie et
              l&apos;Afrique. Sûr, abordable et fiable.
            </p>
            <div className="space-y-3">
              <a 
                href={`mailto:${contact_email}`}
                className="flex items-center gap-3 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>{contact_email}</span>
              </a>
              <a 
                href={`tel:${contact_phone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>{contact_phone}</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{contact_address}</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-heading font-semibold text-sm text-white mb-4 uppercase tracking-wider">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Tuma Plus. Tous droits réservés.
          </p>

          <div className="flex items-center gap-4">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsapp_number.replace(/\s/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors text-sm font-medium"
              aria-label="Contactez-nous sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {[
                { name: 'Facebook', url: facebook_url, icon: 'f' },
                { name: 'X', url: twitter_url, icon: '𝕏' },
                { name: 'Instagram', url: instagram_url, icon: 'ig' },
                { name: 'LinkedIn', url: linkedin_url, icon: 'in' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <span className="text-xs font-bold">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
