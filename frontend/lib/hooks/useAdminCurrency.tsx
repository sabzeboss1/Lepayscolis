'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

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
        const [settingsData, currenciesData] = await Promise.all([
          apiClient.get<{ data: { default_currency?: string } }>(API_ENDPOINTS.admin.settings.get),
          apiClient.get<{ data: ExchangeRate[] }>(API_ENDPOINTS.currencies.list),
        ]);

        if (settingsData?.data?.default_currency) {
          setDefaultCurrency(settingsData.data.default_currency);
        }

        if (currenciesData?.data) {
          const rateMap: Record<string, number> = {};
          currenciesData.data.forEach((c: ExchangeRate) => {
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
      // Handle null, undefined, or NaN values
      if (amount === null || amount === undefined || isNaN(amount)) {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: currency || defaultCurrency,
        }).format(0);
      }

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
