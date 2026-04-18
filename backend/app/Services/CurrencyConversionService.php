<?php

namespace App\Services;

use App\Models\Currency;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CurrencyConversionService
{
    /**
     * Cache TTL for conversion results (30 minutes).
     */
    private const CONVERSION_CACHE_TTL = 1800;

    public function __construct(
        private CurrencyService $currencyService
    ) {}

    /**
     * Convert amount for user display with proper formatting.
     * Always shows the amount in the user's preferred currency.
     *
     * @param float $amount
     * @param string $sourceCurrency
     * @param User $user
     * @return array{amount: float, currency: string, formatted: string, original_amount?: float, original_currency?: string, exchange_rate?: float}
     */
    public function convertForUser(float $amount, string $sourceCurrency, User $user): array
    {
        $targetCurrency = $user->currency_code ?? 'EUR';

        // Si c'est déjà la devise de l'utilisateur, pas de conversion
        if ($sourceCurrency === $targetCurrency) {
            return [
                'amount' => $amount,
                'currency' => $targetCurrency,
                'formatted' => $this->currencyService->format($amount, $targetCurrency),
            ];
        }

        try {
            $conversion = $this->currencyService->convert($amount, $sourceCurrency, $targetCurrency);
            
            return [
                'amount' => $conversion['converted_amount'],
                'currency' => $targetCurrency,
                'formatted' => $this->currencyService->format($conversion['converted_amount'], $targetCurrency),
                'original_amount' => $amount,
                'original_currency' => $sourceCurrency,
                'exchange_rate' => $conversion['exchange_rate'],
            ];
        } catch (\Exception $e) {
            Log::warning('Currency conversion failed', [
                'amount' => $amount,
                'from' => $sourceCurrency,
                'to' => $targetCurrency,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            // Fallback: return original amount with source currency
            return [
                'amount' => $amount,
                'currency' => $sourceCurrency,
                'formatted' => $this->currencyService->format($amount, $sourceCurrency),
            ];
        }
    }

    /**
     * Convert amount for admin display with conversion note.
     * Shows amount in system default currency with original currency note.
     *
     * @param float $amount
     * @param string $sourceCurrency
     * @param string|null $defaultCurrency
     * @return array{amount: float, currency: string, formatted: string, display_formatted: string, original_amount?: float, original_currency?: string}
     */
    public function convertForAdmin(float $amount, string $sourceCurrency, ?string $defaultCurrency = null): array
    {
        $targetCurrency = $defaultCurrency ?? 'EUR';

        // Si c'est déjà la devise par défaut, pas de conversion
        if ($sourceCurrency === $targetCurrency) {
            $formatted = $this->currencyService->format($amount, $targetCurrency);
            return [
                'amount' => $amount,
                'currency' => $targetCurrency,
                'formatted' => $formatted,
                'display_formatted' => $formatted,
            ];
        }

        try {
            $conversion = $this->currencyService->convert($amount, $sourceCurrency, $targetCurrency);
            $convertedFormatted = $this->currencyService->format($conversion['converted_amount'], $targetCurrency);
            $originalFormatted = $this->currencyService->format($amount, $sourceCurrency);
            
            return [
                'amount' => $conversion['converted_amount'],
                'currency' => $targetCurrency,
                'formatted' => $convertedFormatted,
                'display_formatted' => "{$convertedFormatted} ({$originalFormatted})",
                'original_amount' => $amount,
                'original_currency' => $sourceCurrency,
                'exchange_rate' => $conversion['exchange_rate'],
            ];
        } catch (\Exception $e) {
            Log::warning('Admin currency conversion failed', [
                'amount' => $amount,
                'from' => $sourceCurrency,
                'to' => $targetCurrency,
                'error' => $e->getMessage(),
            ]);

            // Fallback: return original amount
            $formatted = $this->currencyService->format($amount, $sourceCurrency);
            return [
                'amount' => $amount,
                'currency' => $sourceCurrency,
                'formatted' => $formatted,
                'display_formatted' => $formatted,
            ];
        }
    }

    /**
     * Convert multiple amounts for batch processing.
     *
     * @param array $items Array of ['amount' => float, 'currency' => string]
     * @param User $user
     * @return array
     */
    public function convertBatchForUser(array $items, User $user): array
    {
        $results = [];
        
        foreach ($items as $key => $item) {
            if (!isset($item['amount']) || !isset($item['currency'])) {
                continue;
            }
            
            $results[$key] = $this->convertForUser(
                (float) $item['amount'],
                (string) $item['currency'],
                $user
            );
        }
        
        return $results;
    }

    /**
     * Get cached exchange rate between two currencies.
     *
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return float|null
     */
    public function getCachedExchangeRate(string $fromCurrency, string $toCurrency): ?float
    {
        if ($fromCurrency === $toCurrency) {
            return 1.0;
        }

        $cacheKey = "exchange_rate_{$fromCurrency}_{$toCurrency}";
        
        return Cache::remember($cacheKey, self::CONVERSION_CACHE_TTL, function () use ($fromCurrency, $toCurrency) {
            try {
                $conversion = $this->currencyService->convert(1, $fromCurrency, $toCurrency);
                return $conversion['exchange_rate'];
            } catch (\Exception $e) {
                Log::warning('Failed to cache exchange rate', [
                    'from' => $fromCurrency,
                    'to' => $toCurrency,
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        });
    }

    /**
     * Validate that a currency conversion is possible.
     *
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return bool
     */
    public function canConvert(string $fromCurrency, string $toCurrency): bool
    {
        if ($fromCurrency === $toCurrency) {
            return true;
        }

        try {
            $fromCurrencyModel = $this->currencyService->getCurrency($fromCurrency);
            $toCurrencyModel = $this->currencyService->getCurrency($toCurrency);
            
            return $fromCurrencyModel->is_active && $toCurrencyModel->is_active;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get user's preferred currency with fallback.
     *
     * @param User|null $user
     * @return string
     */
    public function getUserCurrency(?User $user): string
    {
        return $user?->currency_code ?? 'EUR';
    }

    /**
     * Format amount with currency symbol for display.
     *
     * @param float $amount
     * @param string $currency
     * @param bool $showCurrencyCode
     * @return string
     */
    public function formatForDisplay(float $amount, string $currency, bool $showCurrencyCode = false): string
    {
        $formatted = $this->currencyService->format($amount, $currency);
        
        if ($showCurrencyCode && !str_contains($formatted, $currency)) {
            $formatted .= " ({$currency})";
        }
        
        return $formatted;
    }

    /**
     * Clear conversion cache.
     */
    public function clearConversionCache(): void
    {
        // Clear all exchange rate cache keys
        $currencies = Currency::active()->pluck('code')->toArray();
        
        foreach ($currencies as $from) {
            foreach ($currencies as $to) {
                if ($from !== $to) {
                    Cache::forget("exchange_rate_{$from}_{$to}");
                }
            }
        }
    }
}