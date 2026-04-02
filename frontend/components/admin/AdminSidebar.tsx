'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Plane,
  Package,
  PackageSearch,
  Wallet,
  CreditCard,
  Coins,
  Globe,
  MapPin,
  MessageSquare,
  Star,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface MenuItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

interface MenuSection {
  titleKey: string;
  items: MenuItem[];
}

interface AdminSidebarProps {
  userRole: 'admin' | 'super_admin';
}

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  const menuSections: MenuSection[] = [
    {
      titleKey: 'admin.sidebar.overview',
      items: [
        { labelKey: 'admin.sidebar.dashboard', href: '/admin/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      titleKey: 'admin.sidebar.management',
      items: [
        { labelKey: 'admin.sidebar.users', href: '/admin/users', icon: Users },
        { labelKey: 'admin.sidebar.kycVerification', href: '/admin/kyc', icon: FileCheck },
        { labelKey: 'admin.sidebar.trips', href: '/admin/trips', icon: Plane },
        { labelKey: 'admin.sidebar.shipments', href: '/admin/shipments', icon: Package },
        { labelKey: 'admin.sidebar.shipmentRequests', href: '/admin/shipment-requests', icon: PackageSearch },
        { labelKey: 'admin.sidebar.countries', href: '/admin/countries', icon: Globe },
        { labelKey: 'admin.sidebar.cities', href: '/admin/cities', icon: MapPin }
      ]
    },
    {
      titleKey: 'admin.sidebar.financial',
      items: [
        { labelKey: 'admin.sidebar.wallets', href: '/admin/wallets', icon: Wallet },
        { labelKey: 'admin.sidebar.withdrawals', href: '/admin/withdrawals', icon: CreditCard },
        { labelKey: 'admin.sidebar.payments', href: '/admin/payments', icon: CreditCard },
        { labelKey: 'admin.sidebar.currencies', href: '/admin/currencies', icon: Coins }
      ]
    },
    {
      titleKey: 'admin.sidebar.content',
      items: [
        { labelKey: 'admin.sidebar.messages', href: '/admin/messages', icon: MessageSquare },
        { labelKey: 'admin.sidebar.ratings', href: '/admin/ratings', icon: Star }
      ]
    },
    {
      titleKey: 'admin.sidebar.system',
      items: [
        { labelKey: 'admin.sidebar.settings', href: '/admin/settings', icon: Settings, superAdminOnly: true },
        { labelKey: 'admin.sidebar.analytics', href: '/admin/analytics', icon: BarChart3 },
        { labelKey: 'admin.sidebar.auditLogs', href: '/admin/audit-logs', icon: FileText }
      ]
    },
    {
      titleKey: 'admin.sidebar.superAdmin',
      items: [
        { labelKey: 'admin.sidebar.adminUsers', href: '/admin/admins', icon: Shield, superAdminOnly: true },
        { labelKey: 'admin.sidebar.notifications', href: '/admin/notifications', icon: Bell, superAdminOnly: true }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !item.superAdminOnly || userRole === 'super_admin'
    )
  })).filter(section => section.items.length > 0);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-lg text-gray-900">Admin</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center justify-center w-full">
              <Package className="w-8 h-8 text-blue-600" />
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1 hover:bg-gray-100 rounded"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-4">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t(section.titleKey)}
                </h3>
              )}
              <ul className="space-y-1 px-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const label = t(item.labelKey);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`
                          flex items-center px-3 py-2 rounded-lg transition-colors
                          ${active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                          ${isCollapsed ? 'justify-center' : 'space-x-3'}
                        `}
                        title={isCollapsed ? label : undefined}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-700' : 'text-gray-500'}`} />
                        {!isCollapsed && (
                          <span className="font-medium">{label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          {!isCollapsed ? (
            <div className="text-xs text-gray-500 text-center">
              <p>{t('admin.sidebar.version')}</p>
              <p className="mt-1">&copy; 2026 Le Pays Express Colis</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full" title="System operational" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
