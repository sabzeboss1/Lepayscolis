'use client';

import React from 'react';
import { useCurrencyFormatter } from '@/lib/hooks/useCurrencyFormatter';

interface CurrencyDisplayProps {
  /** Montant à afficher */
  amount: number;
  /** Code de devise du montant (optionnel, utilise la devise de l'utilisateur par défaut) */
  currency?: string;
  /** Afficher une note si la devise diffère de celle de l'utilisateur */
  showCurrencyNote?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
  /** Taille du texte */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  /** Poids de la police */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** Couleur du texte */
  color?: 'default' | 'muted' | 'success' | 'danger' | 'warning' | 'info';
  /** Afficher le signe + pour les montants positifs */
  showPlusSign?: boolean;
  /** Forcer l'affichage des décimales même pour les devises zéro-décimales */
  forceDecimals?: boolean;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorClasses = {
  default: 'text-slate-900',
  muted: 'text-slate-500',
  success: 'text-green-600',
  danger: 'text-red-600',
  warning: 'text-orange-600',
  info: 'text-blue-600',
};

export function CurrencyDisplay({
  amount,
  currency,
  showCurrencyNote = true,
  className = '',
  size = 'base',
  weight = 'normal',
  color = 'default',
  showPlusSign = false,
  forceDecimals = false,
}: CurrencyDisplayProps) {
  const { formatCurrency, formatWithCurrencyNote, userCurrency, isHydrated } = useCurrencyFormatter();

  const displayAmount = showPlusSign && amount > 0 ? `+${amount}` : amount;
  
  // If no currency is provided, use user's currency (means it's already converted)
  const effectiveCurrency = currency || userCurrency;
  
  const formattedAmount = (isHydrated && showCurrencyNote && currency && currency !== userCurrency)
    ? formatWithCurrencyNote(Math.abs(amount), currency)
    : formatCurrency(Math.abs(amount), effectiveCurrency, { forceDecimals });

  const finalAmount = showPlusSign && amount > 0 
    ? `+${formattedAmount}`
    : amount < 0 
      ? `-${formattedAmount}`
      : formattedAmount;

  const classes = [
    sizeClasses[size],
    weightClasses[weight],
    colorClasses[color],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span 
      className={classes} 
      title={currency && currency !== userCurrency ? `Original: ${currency}` : undefined}
      suppressHydrationWarning
    >
      {finalAmount}
    </span>
  );
}

interface CurrencyBadgeProps {
  /** Montant à afficher */
  amount: number;
  /** Code de devise du montant */
  currency?: string;
  /** Variante du badge */
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  /** Taille du badge */
  size?: 'sm' | 'base' | 'lg';
  /** Afficher le signe + pour les montants positifs */
  showPlusSign?: boolean;
}

const badgeVariants = {
  default: 'bg-slate-100 text-slate-800',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-orange-100 text-orange-800',
  info: 'bg-blue-100 text-blue-800',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  base: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function CurrencyBadge({
  amount,
  currency,
  variant = 'default',
  size = 'base',
  showPlusSign = false,
}: CurrencyBadgeProps) {
  const classes = [
    'inline-flex items-center rounded-full font-medium',
    badgeVariants[variant],
    badgeSizes[size],
  ].join(' ');

  return (
    <span className={classes}>
      <CurrencyDisplay
        amount={amount}
        currency={currency}
        showPlusSign={showPlusSign}
        className="!text-inherit"
      />
    </span>
  );
}

interface CurrencyComparisonProps {
  /** Montant original */
  originalAmount: number;
  /** Devise originale */
  originalCurrency: string;
  /** Montant converti (optionnel, sera calculé automatiquement) */
  convertedAmount?: number;
  /** Devise convertie (optionnel, utilise la devise de l'utilisateur) */
  convertedCurrency?: string;
  /** Afficher la conversion en premier */
  showConvertedFirst?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

export function CurrencyComparison({
  originalAmount,
  originalCurrency,
  convertedAmount,
  convertedCurrency,
  showConvertedFirst = true,
  className = '',
}: CurrencyComparisonProps) {
  const { formatCurrency, userCurrency, isHydrated } = useCurrencyFormatter();

  const targetCurrency = convertedCurrency || userCurrency;
  const needsConversion = isHydrated && originalCurrency !== targetCurrency;

  if (!needsConversion) {
    return (
      <CurrencyDisplay
        amount={originalAmount}
        currency={originalCurrency}
        className={className}
      />
    );
  }

  const originalFormatted = formatCurrency(originalAmount, originalCurrency);
  const convertedFormatted = convertedAmount 
    ? formatCurrency(convertedAmount, targetCurrency)
    : formatCurrency(originalAmount, targetCurrency); // Auto-conversion via hook

  return (
    <span className={className} suppressHydrationWarning>
      {showConvertedFirst ? (
        <>
          <span className="font-medium">{convertedFormatted}</span>
          <span className="text-slate-500 text-sm ml-1">({originalFormatted})</span>
        </>
      ) : (
        <>
          <span className="font-medium">{originalFormatted}</span>
          <span className="text-slate-500 text-sm ml-1">≈ {convertedFormatted}</span>
        </>
      )}
    </span>
  );
}