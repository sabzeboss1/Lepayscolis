'use client';

import { useState, useEffect } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchange_rate: number;
  is_base: boolean;
  is_active: boolean;
}

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch('/api/currencies', {
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch currencies');
        }

        const data = await response.json();
        setCurrencies(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Convert amount to the base currency for comparison/sorting
  const convertToBase = (amount: number, currencyCode: string): number => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return amount;

    if (currency.is_base) {
      return amount;
    }

    // Convert to base currency using exchange rate
    return amount / currency.exchange_rate;
  };

  return {
    currencies,
    isLoading,
    error,
    convertToBase,
  };
}