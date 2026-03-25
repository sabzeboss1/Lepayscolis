'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface ExchangeRate {
  code: string;
  exchange_rate: number;
}

interface AdminCurrencyContextType {
  defaultCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  convertToDefault: (amount: number, fromCurrency: string) => number;
}

const AdminCurrencyContext = createContext<AdminCurrencyContextType>({
  defaultCurrency: 'EUR',
  formatCurrency: (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount),
  convertToDefault: (amount: number) => amount,
});

export function AdminCurrencyProvider({ children }: { children: ReactNode }) {
  const [defaultCurrency, setDefaultCurrency] = useState('EUR');
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settings and currencies in parallel
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const [settingsRes, currenciesRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch(`${apiUrl}/api/currencies`),
        ]);

        if (settingsRes.ok) {
          const result = await settingsRes.json();
          const currency = result.data?.default_currency;
          if (currency) {
            setDefaultCurrency(currency);
          }
        }

        if (currenciesRes.ok) {
          const result = await currenciesRes.json();
          const rateMap: Record<string, number> = {};
          (result.data || []).forEach((c: ExchangeRate) => {
            rateMap[c.code] = Number(c.exchange_rate);
          });
          setRates(rateMap);
        }
      } catch {
        // Keep defaults
      }
    };

    fetchData();
  }, []);

  const convertToDefault = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (fromCurrency === defaultCurrency) return amount;

      const fromRate = rates[fromCurrency];
      const toRate = rates[defaultCurrency];

      if (!fromRate || !toRate) return amount;

      return Math.round(amount * (toRate / fromRate) * 100) / 100;
    },
    [defaultCurrency, rates]
  );

  const formatCurrency = useCallback(
    (amount: number, currency?: string) => {
      // If a per-record currency is provided and differs from system default,
      // convert the amount to system default currency first
      let displayAmount = amount;
      let displayCode = defaultCurrency;

      if (currency && currency !== defaultCurrency) {
        displayAmount = convertToDefault(amount, currency);
      } else if (currency) {
        displayCode = currency;
      }

      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: displayCode,
      }).format(displayAmount);
    },
    [defaultCurrency, convertToDefault]
  );

  return (
    <AdminCurrencyContext.Provider value={{ defaultCurrency, formatCurrency, convertToDefault }}>
      {children}
    </AdminCurrencyContext.Provider>
  );
}

export function useAdminCurrency() {
  return useContext(AdminCurrencyContext);
}
