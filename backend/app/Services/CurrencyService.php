<?php

namespace App\Services;

use App\Models\Currency;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class CurrencyService
{
    /**
     * Cache TTL for currency data (1 hour).
     */
    private const CACHE_TTL = 3600;

    /**
     * Zero-decimal currencies (do NOT multiply by 100 for Stripe).
     */
    private const ZERO_DECIMAL_CURRENCIES = [
        'xaf', 'xof', 'bif', 'clp', 'djf', 'gnf', 'jpy',
        'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv',
    ];

    /**
     * Convert amount between currencies.
     * All conversions pivot through the base currency (EUR).
     *
     * Formula: converted = amount * (toRate / fromRate)
     *
     * @param float $amount
     * @param string $fromCurrency ISO 4217 code
     * @param string $toCurrency ISO 4217 code
     * @return array{converted_amount: float, exchange_rate: float, from: string, to: string}
     * @throws \InvalidArgumentException if currency code not found or inactive
     */
    public function convert(float $amount, string $fromCurrency, string $toCurrency): array
    {
        if ($fromCurrency === $toCurrency) {
            return [
                'converted_amount' => $amount,
                'exchange_rate' => 1.0,
                'from' => $fromCurrency,
                'to' => $toCurrency,
            ];
        }

        $fromRate = $this->getExchangeRate($fromCurrency);
        $toRate = $this->getExchangeRate($toCurrency);

        // Convert to base first (amount / fromRate), then to target (* toRate)
        $rate = $toRate / $fromRate;
        $converted = round($amount * $rate, 2);

        return [
            'converted_amount' => $converted,
            'exchange_rate' => round($rate, 6),
            'from' => $fromCurrency,
            'to' => $toCurrency,
        ];
    }

    /**
     * Get cached exchange rate for a currency code.
     *
     * @param string $code ISO 4217
     * @return float
     * @throws \InvalidArgumentException if code not found or inactive
     */
    public function getExchangeRate(string $code): float
    {
        $currency = $this->getCurrency($code);
        return (float) $currency->exchange_rate;
    }

    /**
     * Get all active currencies (cached).
     *
     * @return Collection
     */
    public function getActiveCurrencies(): Collection
    {
        return Cache::remember('currencies_active', self::CACHE_TTL, function () {
            return Currency::active()->orderBy('code')->get();
        });
    }

    /**
     * Get a single currency by code (cached).
     *
     * @param string $code ISO 4217
     * @return Currency
     * @throws \InvalidArgumentException if not found
     */
    public function getCurrency(string $code): Currency
    {
        $currency = Currency::findByCode($code);

        if (!$currency) {
            throw new \InvalidArgumentException(
                __('messages.currency.not_found', ['code' => $code])
            );
        }

        return $currency;
    }

    /**
     * Format amount with currency symbol.
     *
     * @param float $amount
     * @param string $currencyCode ISO 4217
     * @return string e.g. "100.50 €", "65,595 FCFA"
     */
    public function format(float $amount, string $currencyCode): string
    {
        try {
            $currency = $this->getCurrency($currencyCode);
            $symbol = $currency->symbol;
        } catch (\InvalidArgumentException $e) {
            $symbol = $currencyCode;
        }

        // Zero-decimal currencies: no decimals
        if (in_array(strtolower($currencyCode), self::ZERO_DECIMAL_CURRENCIES)) {
            return number_format($amount, 0) . ' ' . $symbol;
        }

        return number_format($amount, 2) . ' ' . $symbol;
    }

    /**
     * Convert an amount for display in the authenticated user's preferred currency.
     *
     * @param float $amount
     * @param string $fromCurrency ISO 4217
     * @param User|null $user If null, returns original amount only
     * @return array{original_amount: float, original_currency: string, converted_amount: float, converted_currency: string, formatted: string, exchange_rate: float}
     */
    public function convertForDisplay(float $amount, string $fromCurrency, ?User $user = null): array
    {
        $toCurrency = $user?->currency_code ?? $fromCurrency;

        $conversion = $this->convert($amount, $fromCurrency, $toCurrency);

        return [
            'original_amount' => $amount,
            'original_currency' => $fromCurrency,
            'converted_amount' => $conversion['converted_amount'],
            'converted_currency' => $toCurrency,
            'formatted' => $this->format($conversion['converted_amount'], $toCurrency),
            'exchange_rate' => $conversion['exchange_rate'],
        ];
    }

    /**
     * Update exchange rate for a currency (admin operation).
     * Clears cache. Prevents updating the base currency rate.
     *
     * @param string $code ISO 4217
     * @param float $newRate
     * @return Currency
     * @throws \InvalidArgumentException
     */
    public function updateExchangeRate(string $code, float $newRate): Currency
    {
        $currency = $this->getCurrency($code);

        if ($currency->is_base) {
            throw new \InvalidArgumentException(
                __('messages.currency.cannot_update_base_rate')
            );
        }

        if ($newRate <= 0) {
            throw new \InvalidArgumentException(
                __('messages.currency.rate_must_be_positive')
            );
        }

        $currency->update(['exchange_rate' => $newRate]);
        $this->clearCache();

        return $currency->fresh();
    }

    /**
     * Toggle currency active status (admin operation).
     * Prevents deactivating the base currency.
     *
     * @param string $code ISO 4217
     * @param bool $active
     * @return Currency
     * @throws \InvalidArgumentException
     */
    public function toggleActive(string $code, bool $active): Currency
    {
        $currency = $this->getCurrency($code);

        if ($currency->is_base && !$active) {
            throw new \InvalidArgumentException(
                __('messages.currency.cannot_deactivate_base')
            );
        }

        $currency->update(['is_active' => $active]);
        $this->clearCache();

        return $currency->fresh();
    }

    /**
     * Create a new currency (admin operation).
     *
     * @param array $data
     * @return Currency
     */
    public function createCurrency(array $data): Currency
    {
        $currency = Currency::create($data);
        $this->clearCache();

        return $currency;
    }

    /**
     * Check if a currency code is valid and active.
     *
     * @param string $code ISO 4217
     * @return bool
     */
    public function isValidCurrency(string $code): bool
    {
        try {
            $currency = $this->getCurrency($code);
            return $currency->is_active;
        } catch (\InvalidArgumentException $e) {
            return false;
        }
    }

    /**
     * Get the Stripe-compatible amount (handles zero-decimal currencies).
     *
     * @param float $amount
     * @param string $currencyCode ISO 4217
     * @return int Amount in smallest currency unit
     */
    public function getStripeAmount(float $amount, string $currencyCode): int
    {
        if (in_array(strtolower($currencyCode), self::ZERO_DECIMAL_CURRENCIES)) {
            return (int) round($amount);
        }

        return (int) round($amount * 100);
    }

    /**
     * Clear all currency-related caches.
     */
    public function clearCache(): void
    {
        Currency::clearCache();
    }
}
