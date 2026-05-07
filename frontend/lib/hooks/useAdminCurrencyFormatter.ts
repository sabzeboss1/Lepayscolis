'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import React from 'react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface ExchangeRate {
  code: string;
  exchange_rate: number;
}

interface AdminCurrencyFormatterContextType {
  defaultCurrency: string;
  formatCurrency: (amount: number, sourceCurrency?: string, options?: FormatOptions) => string;
  convertToDefault: (amount: number, fromCurrency: string) => number;
  formatWithConversion: (amount: number, sourceCurrency?: string) => string;
}

interface FormatOptions {
  showOriginal?: boolean;
  showConversion?: boolean;
  locale?: string;
}

const ZERO_DECIMAL_CURRENCIES = [
  'XAF', 'XOF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY',
  'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  'XAF': 'FCFA',
  'XOF': 'FCFA',
  'EUR': 'EUR',
  'USD': 'USD',
  'GBP': 'GBP',
  'RUB': 'RUB',
  'CAD': 'CAD',
};

const AdminCurrencyFormatterContext = createContext<AdminCurrencyFormatterContextType>({
  defaultCurrency: 'XAF',
  formatCurrency: (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount),
  convertToDefault: (amount: number) => amount,
  formatWithConversion: (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount),
});

export function AdminCurrencyFormatterProvider({ children }: { children: ReactNode }) {
  const [defaultCurrency, setDefaultCurrency] = useState('XAF');
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const formatCurrencyAmount = useCallback(
    (amount: number, currency: string, locale = 'fr-FR') => {
      const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase());
      const displayAmount = isZeroDecimal ? Math.round(amount) : amount;

      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: isZeroDecimal ? 0 : 2,
          maximumFractionDigits: isZeroDecimal ? 0 : 2,
        }).format(displayAmount);
      } catch (error) {
        const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
        const formattedAmount = isZeroDecimal
          ? displayAmount.toLocaleString(locale)
          : displayAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${formattedAmount} ${symbol}`;
      }
    },
    []
  );

  const formatCurrency = useCallback(
    (amount: number, sourceCurrency?: string, options: FormatOptions = {}) => {
      const {
        showOriginal = false,
        showConversion = true,
        locale = 'fr-FR'
      } = options;

      const source = sourceCurrency || defaultCurrency;
      
      if (source === defaultCurrency) {
        return formatCurrencyAmount(amount, source, locale);
      }

      const convertedAmount = convertToDefault(amount, source);
      const convertedFormatted = formatCurrencyAmount(convertedAmount, defaultCurrency, locale);

      if (showOriginal && showConversion) {
        const originalFormatted = formatCurrencyAmount(amount, source, locale);
        return `${convertedFormatted} (${originalFormatted})`;
      }

      return convertedFormatted;
    },
    [defaultCurrency, convertToDefault, formatCurrencyAmount]
  );

  const formatWithConversion = useCallback(
    (amount: number, sourceCurrency?: string) => {
      const source = sourceCurrency || defaultCurrency;
      
      if (source === defaultCurrency) {
        return formatCurrencyAmount(amount, source);
      }

      const convertedAmount = convertToDefault(amount, source);
      const convertedFormatted = formatCurrencyAmount(convertedAmount, defaultCurrency);
      const originalFormatted = formatCurrencyAmount(amount, source);
      
      return `${convertedFormatted} (${originalFormatted})`;
    },
    [defaultCurrency, convertToDefault, formatCurrencyAmount]
  );

  const contextValue = {
    defaultCurrency,
    formatCurrency,
    convertToDefault,
    formatWithConversion
  };

  return React.createElement(
    AdminCurrencyFormatterContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAdminCurrencyFormatter() {
  return useContext(AdminCurrencyFormatterContext);
}
