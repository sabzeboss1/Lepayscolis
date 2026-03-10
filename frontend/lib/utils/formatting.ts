/**
 * Formatting utilities for dates, currencies, and numbers according to locale
 */

/**
 * Format date according to locale
 * @param date - Date to format
 * @param locale - Locale code (fr, en)
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatDate(
  date: Date | string,
  locale: string = 'fr',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format date and time according to locale
 * @param date - Date to format
 * @param locale - Locale code (fr, en)
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'fr'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format date as short format (e.g., 01/12/2024)
 * @param date - Date to format
 * @param locale - Locale code (fr, en)
 */
export function formatDateShort(
  date: Date | string,
  locale: string = 'fr'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "il y a 2 heures")
 * @param date - Date to format
 * @param locale - Locale code (fr, en)
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = 'fr'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Format currency according to locale
 * @param amount - Amount to format
 * @param currency - Currency code (EUR, USD, XOF, etc.)
 * @param locale - Locale code (fr, en)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number according to locale
 * @param value - Number to format
 * @param locale - Locale code (fr, en)
 * @param options - Intl.NumberFormatOptions
 */
export function formatNumber(
  value: number,
  locale: string = 'fr',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format weight with unit
 * @param weight - Weight in kg
 * @param locale - Locale code (fr, en)
 */
export function formatWeight(weight: number, locale: string = 'fr'): string {
  const unit = locale === 'en' ? 'kg' : 'kg';
  return `${formatNumber(weight, locale, { maximumFractionDigits: 2 })} ${unit}`;
}

/**
 * Format percentage
 * @param value - Value to format as percentage (0-1 or 0-100)
 * @param locale - Locale code (fr, en)
 * @param asDecimal - Whether value is decimal (0-1) or percentage (0-100)
 */
export function formatPercentage(
  value: number,
  locale: string = 'fr',
  asDecimal: boolean = false
): string {
  const percentValue = asDecimal ? value : value / 100;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(percentValue);
}
