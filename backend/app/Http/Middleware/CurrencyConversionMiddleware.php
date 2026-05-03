<?php

namespace App\Http\Middleware;

use App\Services\CurrencyConversionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CurrencyConversionMiddleware
{
    public function __construct(
        private CurrencyConversionService $conversionService
    ) {}

    /**
     * Handle an incoming request and add currency conversions to JSON responses.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\JsonResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only process JSON responses for authenticated users
        if (!$response instanceof JsonResponse || !Auth::check()) {
            return $response;
        }

        $user = Auth::user();
        $data = $response->getData(true);

        // Process the response data to add currency conversions
        $processedData = $this->processDataForCurrencyConversion($data, $user);

        if ($processedData !== $data) {
            $response->setData($processedData);
        }

        return $response;
    }

    /**
     * Recursively process data to add currency conversions.
     *
     * @param mixed $data
     * @param \App\Models\User $user
     * @return mixed
     */
    private function processDataForCurrencyConversion($data, $user)
    {
        if (is_array($data)) {
            return $this->processArrayForCurrencyConversion($data, $user);
        }

        return $data;
    }

    /**
     * Process array data for currency conversions.
     *
     * @param array $data
     * @param \App\Models\User $user
     * @return array
     */
    private function processArrayForCurrencyConversion(array $data, $user): array
    {
        $isSequential = array_is_list($data);
        $processed = [];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $processed[$key] = $this->processArrayForCurrencyConversion($value, $user);
            } else {
                $processed[$key] = $value;
            }

            // Add currency conversions for specific patterns
            if ($this->shouldAddCurrencyConversion($key, $data)) {
                $currencyKey = $this->getCurrencyKey($key, $data);
                if ($currencyKey && isset($data[$currencyKey])) {
                    $conversion = $this->conversionService->convertForUser(
                        (float) $value,
                        (string) $data[$currencyKey],
                        $user
                    );
                    
                    // Add converted fields
                    $processed[$key . '_converted'] = $conversion['amount'];
                    $processed[$key . '_formatted'] = $conversion['formatted'];
                    
                    if (isset($conversion['original_amount'])) {
                        $processed[$key . '_original'] = $conversion['original_amount'];
                        $processed[$key . '_original_currency'] = $conversion['original_currency'];
                        $processed[$key . '_exchange_rate'] = $conversion['exchange_rate'];
                    }
                }
            }
        }

        // Re-index sequential arrays to prevent JSON object serialization
        if ($isSequential && !empty($processed)) {
            $processed = array_values($processed);
        }

        return $processed;
    }

    /**
     * Determine if a field should have currency conversion added.
     *
     * @param string $key
     * @param array $data
     * @return bool
     */
    private function shouldAddCurrencyConversion(string $key, array $data): bool
    {
        // Fields that represent monetary amounts
        $monetaryFields = [
            'amount',
            'price',
            'price_per_kg',
            'max_budget',
            'proposed_price',
            'balance',
            'total_credits',
            'total_debits',
            'total_adjustments',
            'base_amount',
            'sender_fee',
            'traveler_fee',
            'platform_fee',
            'traveler_amount',
            'payment_amount',
            'net_amount',
            'fee',
        ];

        return in_array($key, $monetaryFields) && is_numeric($data[$key] ?? null);
    }

    /**
     * Get the corresponding currency key for a monetary field.
     *
     * @param string $monetaryKey
     * @param array $data
     * @return string|null
     */
    private function getCurrencyKey(string $monetaryKey, array $data): ?string
    {
        // Common currency field patterns
        $currencyFields = [
            'currency_code',
            'currency',
        ];

        foreach ($currencyFields as $field) {
            if (isset($data[$field])) {
                return $field;
            }
        }

        return null;
    }
}