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
  const { logo_url } = usePlatformBranding();

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
              <div className="flex items-center gap-3 text-sm text-white/50">
                <Mail className="w-4 h-4 shrink-0" />
                <span>contact@tumaplus.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Paris, France</span>
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
              href="https://wa.me/33123456789"
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
              {['Facebook', 'X', 'Instagram', 'LinkedIn'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  aria-label={social}
                >
                  <span className="text-xs font-bold">
                    {social === 'Facebook'
                      ? 'f'
                      : social === 'X'
                        ? '𝕏'
                        : social === 'Instagram'
                          ? 'ig'
                          : 'in'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
