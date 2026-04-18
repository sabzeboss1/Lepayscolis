<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $walletCurrency = $this->currency_code ?? 'EUR';
        $currencyService = app(\App\Services\CurrencyService::class);

        $data = [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'balance' => (float) $this->balance,
            'currency_code' => $walletCurrency,
            'formatted_balance' => $currencyService->format(
                (float) $this->balance,
                $walletCurrency
            ),
            'balance_converted' => null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];

        // Convert balance to user's preferred currency if different
        $user = $request->user() ?? auth('sanctum')->user();
        $userCurrency = $user?->currency_code;

        if ($userCurrency && $userCurrency !== $walletCurrency) {
            try {
                $conversion = $currencyService->convert(
                    (float) $this->balance,
                    $walletCurrency,
                    $userCurrency
                );
                $data['balance_converted'] = [
                    'amount' => $conversion['converted_amount'],
                    'currency_code' => $userCurrency,
                    'exchange_rate' => $conversion['exchange_rate'],
                ];
            } catch (\Exception $e) {
                // If conversion fails, leave balance_converted as null
            }
        }

        return $data;
    }
}
