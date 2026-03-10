'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/features/NotificationDropdown';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Locale } from '@/lib/i18n/config';
import { User } from '@/lib/types/user';

export interface HeaderAppProps {
  user: User;
  locale: Locale;
  unreadMessages?: number;
  onLogout: () => void;
}

export const HeaderApp: React.FC<HeaderAppProps> = ({
  user,
  locale: initialLocale,
  unreadMessages = 0,
  onLogout,
}) => {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t } = useTranslation(locale);
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isUserMenuOpen) {
        setIsUserMenuOpen(false);
        // Return focus to the trigger button
        const triggerButton = userMenuRef.current?.querySelector('button');
        triggerButton?.focus();
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUserMenuOpen]);

  // Prevent body scroll when mobile menu is open
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
    { href: '/dashboard', label: t('navigation.dashboard'), icon: '📊' },
    { href: '/trips', label: t('navigation.trips'), icon: '✈️' },
    { href: '/shipments', label: t('navigation.shipments'), icon: '📦' },
    { href: '/wallet', label: t('navigation.wallet'), icon: '💰' },
    { href: '/messages', label: t('navigation.messages'), icon: '💬', badge: unreadMessages },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
            aria-label="LePaysExpressColis Dashboard"
          >
            <Image
              src="/logo.png"
              alt="LePaysExpressColis"
              width={64}
              height={64}
              className="w-14 h-14 md:w-16 md:h-16 hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4" aria-label="Main navigation">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isActiveLink(link.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }
                `}
                aria-current={isActiveLink(link.href) ? 'page' : undefined}
              >
                <span role="img" aria-hidden="true">
                  {link.icon}
                </span>
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    aria-label={`${link.badge} unread messages`}
                  >
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} onLocaleChange={handleLocaleChange} />

            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''
                    }`}
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
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                  role="menu"
                  aria-orientation="vertical"
                  onKeyDown={(e) => {
                    // Handle keyboard navigation within menu
                    const menuItems = e.currentTarget.querySelectorAll('[role="menuitem"]');
                    const currentIndex = Array.from(menuItems).indexOf(document.activeElement as HTMLElement);

                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
                      (menuItems[nextIndex] as HTMLElement).focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
                      (menuItems[prevIndex] as HTMLElement).focus();
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      (menuItems[0] as HTMLElement).focus();
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      (menuItems[menuItems.length - 1] as HTMLElement).focus();
                    }
                  }}
                >
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    {user.isRecommended && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        <span role="img" aria-hidden="true">
                          ⭐
                        </span>
                        {t('profile.recommended')}
                      </span>
                    )}
                    {user.kycStatus !== 'approved' && (
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${user.kycStatus === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : user.kycStatus === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                        {user.kycStatus === 'rejected'
                          ? '❌ KYC Rejected'
                          : user.kycStatus === 'pending'
                            ? '⏳ KYC Pending'
                            : '🔒 KYC Required'}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    role="menuitem"
                  >
                    {t('navigation.profile')}
                  </Link>

                  {user.kycStatus !== 'approved' && (
                    <Link
                      href="/kyc"
                      className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 font-medium"
                      role="menuitem"
                    >
                      {user.kycStatus === 'rejected'
                        ? 'Resubmit KYC Documents'
                        : user.kycStatus === 'pending'
                          ? 'View KYC Status'
                          : 'Complete KYC Verification'}
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50"
                    role="menuitem"
                  >
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
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
          <nav className="container mx-auto px-4 py-6 space-y-2" aria-label="Mobile navigation">
            {/* User Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
              </div>
            </div>

            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative flex items-center gap-3 text-base font-medium px-4 py-3 rounded-md transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isActiveLink(link.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                aria-current={isActiveLink(link.href) ? 'page' : undefined}
              >
                <span role="img" aria-hidden="true" className="text-xl">
                  {link.icon}
                </span>
                <span className="flex-1">{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span
                    className="bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
                    aria-label={`${link.badge} unread messages`}
                  >
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
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

              <Link
                href="/profile"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('navigation.profile')}
              </Link>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {t('common.logout')}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
