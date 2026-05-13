'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/features/NotificationDropdown';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { usePlatformBranding } from '@/lib/hooks/usePlatformBranding';
import { Locale } from '@/lib/i18n/config';
import { User } from '@/lib/types/user';
import {
  LayoutDashboard,
  Plane,
  Package,
  Wallet,
  MessageCircle,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Star,
  ChevronDown,
  AlertCircle,
  Clock,
  Search,
} from 'lucide-react';

export interface HeaderAppProps {
  user: User;
  locale: Locale;
  unreadMessages?: number;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'navigation.dashboard', icon: LayoutDashboard },
  { href: '/trips', labelKey: 'navigation.trips', icon: Plane },
  { href: '/shipments/search', labelKey: 'navigation.findShipments', icon: Search },
  { href: '/shipments', labelKey: 'navigation.shipments', icon: Package },
  { href: '/wallet', labelKey: 'navigation.wallet', icon: Wallet },
  // { href: '/messages', labelKey: 'navigation.messages', icon: MessageCircle }, // Temporairement masqué
];

function KycBadge({ status }: { status: User['kyc_status'] }) {
  if (status === 'approved') return null;
  const cfg = {
    pending: { icon: Clock, label: 'KYC en attente', color: '#b45309', bg: '#fef3c7' },
    rejected: { icon: AlertCircle, label: 'KYC rejeté', color: '#b91c1c', bg: '#fee2e2' },
    not_submitted: { icon: ShieldCheck, label: 'KYC requis', color: '#1d4ed8', bg: '#dbeafe' },
  }[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export const HeaderApp: React.FC<HeaderAppProps> = ({
  user,
  locale: initialLocale,
  unreadMessages = 0,
  onLogout,
}) => {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t } = useTranslation(locale);
  const { logo_url } = usePlatformBranding();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* close user menu on route change */
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  /* close on outside click / Escape */
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUserMenuOpen) {
        setIsUserMenuOpen(false);
        userMenuRef.current?.querySelector('button')?.focus();
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onEscape);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isUserMenuOpen]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <>
      {/* ═══════════════════════════════════════════
          TOP HEADER  (all breakpoints)
      ════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center shrink-0 focus-visible:ring-2 focus-visible:ring-royal-blue rounded-lg"
              aria-label="Accueil — LePaysExpressColis"
            >
              <img
                src={logo_url}
                alt="LePaysExpressColis"
                className="w-14 h-14 md:w-16 md:h-16 object-contain hover:opacity-85 transition-opacity"
              />
              <span
                className="hidden sm:block ml-2 text-sm font-bold text-navy leading-tight"
                style={{ fontFamily: 'Prompt, sans-serif' }}
              >
                Tuma<span style={{ color: 'var(--color-vibrant-orange)' }}>Plus</span>
              </span>
            </Link>

            {/* ── Desktop nav (lg+) ── */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
              {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
                const active = isActive(href);
                const isMsgs = href === '/messages';
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{
                      color: active ? 'var(--color-royal-blue)' : '#64748b',
                      background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.background = '#f1f5f9';
                        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-navy)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                        (e.currentTarget as HTMLAnchorElement).style.color = '#64748b';
                      }
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{t(labelKey as Parameters<typeof t>[0])}</span>
                    {isMsgs && unreadMessages > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
                        style={{ background: 'var(--color-vibrant-orange)' }}
                      >
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── Right side actions ── */}
            <div className="flex items-center gap-2">
              {/* Language */}
              <div className="hidden md:block">
                <LanguageSwitcher
                  currentLocale={locale}
                  onLocaleChange={setLocale}
                />
              </div>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User menu (desktop) */}
              <div className="hidden lg:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menu utilisateur"
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors min-h-[40px]"
                  style={{ background: isUserMenuOpen ? '#f1f5f9' : 'transparent' }}
                  onMouseEnter={(e) => {
                    if (!isUserMenuOpen)
                      (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isUserMenuOpen)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{
                      background: user.avatar
                        ? 'transparent'
                        : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                    }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium text-navy max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className="w-3.5 h-3.5 text-slate-400 transition-transform"
                    style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none' }}
                  />
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-2xl py-2 z-50"
                    style={{
                      background: 'rgba(255,255,255,0.96)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}
                    role="menu"
                    aria-orientation="vertical"
                    onKeyDown={(e) => {
                      const items = e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]');
                      const idx = Array.from(items).indexOf(document.activeElement as HTMLElement);
                      if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
                    }}
                  >
                    {/* User info */}
                    <div className="px-4 pt-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold shrink-0"
                          style={{
                            background: user.avatar
                              ? 'transparent'
                              : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                          }}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy truncate">{user.name}</p>
                          <p className="text-xs text-muted-text truncate">{user.email}</p>
                          {user.is_recommended && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                              style={{ background: 'rgba(249,115,22,0.12)', color: '#c2410c' }}
                            >
                              <Star className="w-3 h-3" />
                              Recommandé
                            </span>
                          )}
                          <KycBadge status={user.kyc_status} />
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        {t('navigation.profile')}
                      </Link>

                      {user.kyc_status !== 'approved' && (
                        <Link
                          href="/kyc"
                          role="menuitem"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors"
                          style={{ color: 'var(--color-royal-blue)' }}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {user.kyc_status === 'rejected'
                            ? 'Resoumettre les documents'
                            : user.kyc_status === 'pending'
                            ? 'Voir le statut KYC'
                            : 'Compléter la vérification'}
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          role="menuitem"
                          onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('common.logout')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile: avatar link to profile */}
              <Link
                href="/profile"
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full overflow-hidden text-white text-sm font-bold shrink-0"
                style={{
                  background: user.avatar
                    ? 'transparent'
                    : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                }}
                aria-label="Mon profil"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM TAB BAR  (hidden lg+)
      ════════════════════════════════════════════ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Navigation mobile"
      >
        <div className="flex items-stretch">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const active = isActive(href);
            const isMsgs = href === '/messages';
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors"
                style={{ color: active ? 'var(--color-royal-blue)' : '#94a3b8' }}
              >
                {/* active indicator */}
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ background: 'var(--color-royal-blue)' }}
                  />
                )}

                <div className="relative">
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {isMsgs && unreadMessages > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-white text-[9px] font-bold rounded-full"
                      style={{ background: 'var(--color-vibrant-orange)' }}
                    >
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>

                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ fontWeight: active ? 600 : 400 }}
                >
                  {t(labelKey as Parameters<typeof t>[0])}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer so content isn't hidden behind bottom nav on mobile */}
      <div className="lg:hidden h-[calc(56px+env(safe-area-inset-bottom,0px))] pointer-events-none" />
    </>
  );
};
