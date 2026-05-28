'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { usePlatformBranding } from '@/lib/hooks/usePlatformBranding';
import { Locale, defaultLocale } from '@/lib/i18n/config';

const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Comment ça marche', href: '/how-it-works' },
  { label: 'Destinations', href: '/destinations' },
  { label: 'Sécurité', href: '/security' },
  { label: 'FAQ', href: '/faq' },
];

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lepaysexpresscolis-locale') as Locale | null;
      if (stored === 'fr' || stored === 'en') return stored;
    }
    return defaultLocale;
  });
  const { logo_url } = usePlatformBranding();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src={logo_url}
              alt="Tuma Plus Logo"
              className="h-19 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isScrolled
                    ? 'text-gray-700 hover:text-royal-blue hover:bg-blue-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher
                currentLocale={locale}
                onLocaleChange={setLocale}
              />
            </div>

            {/* Auth */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`font-medium ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Connexion
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="sm"
                  className="bg-vibrant-orange hover:bg-warm-orange text-white font-semibold shadow-lg shadow-orange-500/25"
                >
                  S&apos;inscrire
                </Button>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[calc(100vh-6rem)] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <nav className="flex flex-col gap-1 p-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* Language Switcher in mobile menu */}
              <div className="px-4 py-2">
                <LanguageSwitcher
                  currentLocale={locale}
                  onLocaleChange={setLocale}
                />
              </div>

              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-gray-100 pb-2">
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    fullWidth
                    className="font-medium border-gray-300 text-gray-700"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    fullWidth
                    className="bg-vibrant-orange hover:bg-warm-orange text-white font-semibold"
                  >
                    S&apos;inscrire
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
