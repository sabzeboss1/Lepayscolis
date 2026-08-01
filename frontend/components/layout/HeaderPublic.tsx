'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { usePlatformBranding } from '@/lib/hooks/usePlatformBranding';
import { Locale } from '@/lib/i18n/config';
import { useAuth } from '@/lib/auth';

import { useLocale } from '@/lib/i18n/LocaleContext';

export interface HeaderPublicProps {
  locale?: Locale;
}

export const HeaderPublic: React.FC<HeaderPublicProps> = () => {
  const { locale, setLocale } = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { logo_url } = usePlatformBranding();

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  const navigationLinks = [
    { href: '/', label: t('navigation.home') },
    { href: '/how-it-works', label: t('navigation.howItWorks') },
    { href: '/security', label: t('navigation.security') },
    { href: '/destinations', label: t('navigation.destinations') },
    { href: '/faq', label: t('navigation.faq') },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`
        sticky top-0 z-50 w-full bg-white transition-shadow duration-200
        ${isSticky ? 'shadow-md' : 'border-b border-gray-200'}
      `}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
            aria-label="LePaysExpressColis Home"
          >
            <img
              src={logo_url}
              alt="LePaysExpressColis"
              className="w-14 h-14 md:w-16 md:h-16 hover:opacity-80 transition-opacity object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  text-sm font-medium transition-colors px-3 py-2 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${
                    isActiveLink(link.href)
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }
                `}
                aria-current={isActiveLink(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} onLocaleChange={handleLocaleChange} />
            {!authLoading && (
              user ? (
                <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'}>
                  <Button variant="primary" size="md">
                    {isAdmin ? t('navigation.adminDashboard') : t('navigation.dashboard')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="md">
                      {t('common.login')}
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="primary" size="md">
                      {t('common.register')}
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto"
        >
          <nav className="container mx-auto px-4 py-6 space-y-4" aria-label="Mobile navigation">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  block text-lg font-medium px-4 py-3 rounded-md transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${
                    isActiveLink(link.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                aria-current={isActiveLink(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="px-4">
                <LanguageSwitcher
                  currentLocale={locale}
                  onLocaleChange={handleLocaleChange}
                  className="w-full justify-center"
                />
              </div>

              {!authLoading && (
                user ? (
                  <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'} className="block">
                    <Button variant="primary" size="lg" fullWidth>
                      {isAdmin ? t('navigation.adminDashboard') : t('navigation.dashboard')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="block">
                      <Button variant="ghost" size="lg" fullWidth>
                        {t('common.login')}
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="block">
                      <Button variant="primary" size="lg" fullWidth>
                        {t('common.register')}
                      </Button>
                    </Link>
                  </>
                )
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
