'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Hook that provides currency formatting based on the logged-in user's currency_code preference.
 * Falls back to 'XAF' if no user or no currency_code set.
 * Handles SSR hydration properly.
 */
export function useUserCurrency() {
  const { user } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Prevent hydration mismatch by only using user currency after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  const currencyCode = (isHydrated && user?.currency_code) || 'XAF';

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

  return { currencyCode, currencySymbol, formatCurrency, isHydrated };
}
