'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function AdminBreadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with dashboard
    breadcrumbs.push({ label: 'Dashboard', href: '/admin/dashboard' });

    // Map path segments to readable labels
    const labelMap: Record<string, string> = {
      admin: 'Admin',
      users: 'Users',
      kyc: 'KYC Verification',
      trips: 'Trips',
      shipments: 'Shipments',
      wallets: 'Wallets',
      withdrawals: 'Withdrawals',
      payments: 'Payments',
      messages: 'Messages',
      ratings: 'Ratings',
      settings: 'Settings',
      analytics: 'Analytics',
      'audit-logs': 'Audit Logs',
      admins: 'Admin Users',
      notifications: 'Notifications',
      new: 'New',
      edit: 'Edit'
    };

    let currentPath = '';
    for (let i = 0; i < paths.length; i++) {
      const segment = paths[i];
      
      // Skip 'admin' as it's already in dashboard
      if (segment === 'admin') continue;

      currentPath += `/${segment}`;
      
      // Check if segment is a UUID or ID (skip adding to breadcrumb label)
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                   /^\d+$/.test(segment);
      
      if (isId) {
        // For IDs, use the previous segment's label + "Details"
        const previousLabel = breadcrumbs[breadcrumbs.length - 1]?.label || 'Item';
        breadcrumbs.push({
          label: 'Details',
          href: `/admin${currentPath}`
        });
      } else {
        breadcrumbs.push({
          label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: `/admin${currentPath}`
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb if only dashboard
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-6 bg-gray-50 border-b border-gray-200">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" aria-hidden="true" />
              )}
              
              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {isFirst && <Home className="w-4 h-4 mr-1" aria-hidden="true" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
