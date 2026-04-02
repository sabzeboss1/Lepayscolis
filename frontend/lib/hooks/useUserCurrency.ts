'use client';

import { useCallback } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Hook that provides currency formatting based on the logged-in user's currency_code preference.
 * Falls back to 'EUR' if no user or no currency_code set.
 */
export function useUserCurrency() {
  const { user } = useAuth();
  const currencyCode = user?.currency_code || 'EUR';

  console.log('useUserCurrency - user:', user);
  console.log('useUserCurrency - currencyCode:', currencyCode);

  const formatCurrency = useCallback(
    (amount: number, overrideCurrency?: string) => {
      const code = overrideCurrency || currencyCode;
      try {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: code,
        }).format(amount);
      } catch {
        return `${amount.toFixed(2)} ${code}`;
      }
    },
    [currencyCode]
  );

  const currencySymbol = (() => {
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyCode })
        .formatToParts(0)
        .find(p => p.type === 'currency')?.value || currencyCode;
    } catch {
      return currencyCode;
    }
  })();

  return { currencyCode, currencySymbol, formatCurrency };
}
