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

  // Convert amount to EUR for comparison
  const convertToEUR = (amount: number, currencyCode: string): number => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return amount; // Fallback if currency not found
    
    // If it's already EUR or is the base currency
    if (currency.is_base || currencyCode === 'EUR') {
      return amount;
    }
    
    // Convert to EUR using exchange rate
    return amount / currency.exchange_rate;
  };

  return {
    currencies,
    isLoading,
    error,
    convertToEUR,
  };
}