<?php

namespace App\Http\Resources;

use App\Services\CurrencyConversionService;
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
        $user = $request->user();
        $conversionService = app(CurrencyConversionService::class);

        // Convertir le solde selon la devise préférée de l'utilisateur
        $balanceConversion = $conversionService->convertForUser(
            (float) $this->balance,
            $this->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
            $user
        );

        $heldBalanceConversion = $conversionService->convertForUser(
            (float) $this->held_balance,
            $this->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
            $user
        );

        $availableBalance = (float) $this->balance - (float) $this->held_balance;
        $availableBalanceConversion = $conversionService->convertForUser(
            $availableBalance,
            $this->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
            $user
        );

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,

            // Solde dans la devise préférée de l'utilisateur
            'balance' => $balanceConversion['amount'],
            'currency_code' => $balanceConversion['currency'],
            'formatted_balance' => $balanceConversion['formatted'],

            // Solde bloqué dans la devise préférée de l'utilisateur
            'held_balance' => $heldBalanceConversion['amount'],
            'formatted_held_balance' => $heldBalanceConversion['formatted'],

            // Solde disponible dans la devise préférée de l'utilisateur
            'available_balance' => $availableBalanceConversion['amount'],
            'formatted_available_balance' => $availableBalanceConversion['formatted'],

            // Informations sur la conversion (si applicable)
            'original_balance' => isset($balanceConversion['original_amount']) ? $balanceConversion['original_amount'] : null,
            'original_currency_code' => isset($balanceConversion['original_currency']) ? $balanceConversion['original_currency'] : null,
            'exchange_rate' => isset($balanceConversion['exchange_rate']) ? $balanceConversion['exchange_rate'] : null,

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
