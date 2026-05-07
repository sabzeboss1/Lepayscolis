'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Hook unifié pour le formatage des devises qui gère correctement :
 * - Les devises zéro-décimales (XAF, XOF, JPY, etc.)
 * - La devise préférée de l'utilisateur
 * - Les conversions d'affichage
 * - Les symboles de devises appropriés
 * - La compatibilité avec l'hydratation SSR
 */

// Devises à zéro décimales (pas de centimes)
const ZERO_DECIMAL_CURRENCIES = [
  'XAF', 'XOF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY',
  'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'
];

// Symboles de devises personnalisés
const CURRENCY_SYMBOLS: Record<string, string> = {
  'XAF': 'FCFA',
  'XOF': 'FCFA',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'RUB': '₽',
  'CAD': 'C$',
};

export function useCurrencyFormatter() {
  const { user } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Prevent hydration mismatch by only using user currency after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  const userCurrency = (isHydrated && user?.currency_code) || 'XAF';

  /**
   * Formate un montant avec la devise appropriée
   * @param amount - Montant à formater
   * @param currencyCode - Code de devise (optionnel, utilise la devise de l'utilisateur par défaut)
   * @param options - Options de formatage
   */
  const formatCurrency = useCallback(
    (
      amount: number, 
      currencyCode?: string,
      options: {
        showSymbolOnly?: boolean;
        locale?: string;
        forceDecimals?: boolean;
      } = {}
    ) => {
      // Handle null, undefined, or NaN values
      if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0;
      }

      const {
        showSymbolOnly = false,
        locale = 'fr-FR',
        forceDecimals = false
      } = options;

      const currency = currencyCode || userCurrency;
      const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase());
      
      // Pour les devises zéro-décimales, arrondir à l'entier
      const displayAmount = isZeroDecimal && !forceDecimals 
        ? Math.round(amount) 
        : amount;

      if (showSymbolOnly) {
        const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
        const formattedAmount = isZeroDecimal && !forceDecimals
          ? displayAmount.toLocaleString(locale)
          : displayAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${formattedAmount} ${symbol}`;
      }

      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: isZeroDecimal && !forceDecimals ? 0 : 2,
          maximumFractionDigits: isZeroDecimal && !forceDecimals ? 0 : 2,
        }).format(displayAmount);
      } catch (error) {
        // Fallback si la devise n'est pas supportée par Intl
        const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
        const formattedAmount = isZeroDecimal && !forceDecimals
          ? displayAmount.toLocaleString(locale)
          : displayAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${formattedAmount} ${symbol}`;
      }
    },
    [userCurrency]
  );

  /**
   * Obtient le symbole d'une devise
   * @param currencyCode - Code de devise
   */
  const getCurrencySymbol = useCallback((currencyCode?: string) => {
    const currency = currencyCode || userCurrency;
    return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  }, [userCurrency]);

  /**
   * Vérifie si une devise est à zéro décimales
   * @param currencyCode - Code de devise
   */
  const isZeroDecimalCurrency = useCallback((currencyCode?: string) => {
    const currency = currencyCode || userCurrency;
    return ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase());
  }, [userCurrency]);

  /**
   * Formate un montant avec indication de la devise source si différente
   * @param amount - Montant à afficher
   * @param sourceCurrency - Devise source du montant
   * @param displayNote - Afficher une note si conversion
   */
  const formatWithCurrencyNote = useCallback(
    (amount: number, sourceCurrency?: string, displayNote = true) => {
      const source = sourceCurrency || userCurrency;
      const formatted = formatCurrency(amount, source);
      
      if (displayNote && source !== userCurrency && isHydrated) {
        return `${formatted} (${source})`;
      }
      
      return formatted;
    },
    [formatCurrency, userCurrency, isHydrated]
  );

  return {
    formatCurrency,
    getCurrencySymbol,
    isZeroDecimalCurrency,
    formatWithCurrencyNote,
    userCurrency,
    isHydrated,
  };
}