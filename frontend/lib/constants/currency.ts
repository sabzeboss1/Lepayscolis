/**
 * Static fallback for the system default currency (used before API data loads).
 * For dynamic access, prefer useCurrencies().baseCurrency which reads the
 * actual base currency from the /api/currencies endpoint.
 */
export const DEFAULT_CURRENCY = 'XAF';
