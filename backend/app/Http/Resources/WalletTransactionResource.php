<?php

namespace App\Http\Resources;

use App\Services\CurrencyConversionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletTransactionResource extends JsonResource
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
        
        // Récupérer les données de manière sécurisée
        $data = is_array($this->resource) ? $this->resource : $this->resource->toArray();
        
        // Extraire les valeurs avec des valeurs par défaut
        $amount = (float) ($data['amount'] ?? 0);
        $balanceAfter = (float) ($data['balance_after'] ?? 0);
        $currencyCode = $data['currency_code'] ?? 'EUR';
        $originalAmount = $data['original_amount'] ?? null;
        $originalCurrency = $data['original_currency_code'] ?? null;
        $exchangeRate = $data['exchange_rate_used'] ?? null;
        
        // Convertir le montant selon la devise préférée de l'utilisateur
        $amountConversion = $conversionService->convertForUser(
            $amount,
            $currencyCode,
            $user
        );
        
        // Convertir le solde après transaction
        $balanceAfterConversion = $conversionService->convertForUser(
            $balanceAfter,
            $currencyCode,
            $user
        );
        
        $hasOriginalConversion = !is_null($originalAmount);

        return [
            'id' => $data['id'] ?? null,
            'wallet_id' => $data['wallet_id'] ?? null,
            'type' => $data['type'] ?? null,
            
            // Montant dans la devise préférée de l'utilisateur
            'amount' => $amountConversion['amount'],
            'currency_code' => $amountConversion['currency'],
            'formatted_amount' => $amountConversion['formatted'],
            
            'description' => $data['description'] ?? '',
            'reference_type' => $data['reference_type'] ?? null,
            'reference_id' => $data['reference_id'] ?? null,
            
            // Solde après transaction dans la devise préférée de l'utilisateur
            'balance_after' => $balanceAfterConversion['amount'],
            'formatted_balance_after' => $balanceAfterConversion['formatted'],
            
            // Informations sur la conversion originale (si applicable)
            'original_conversion' => $hasOriginalConversion ? [
                'original_amount' => (float) $originalAmount,
                'original_currency' => $originalCurrency,
                'exchange_rate' => (float) $exchangeRate,
            ] : null,
            
            // Informations sur la conversion pour l'affichage (si applicable)
            'display_conversion' => isset($amountConversion['original_amount']) ? [
                'original_amount' => $amountConversion['original_amount'],
                'original_currency' => $amountConversion['original_currency'],
                'exchange_rate' => $amountConversion['exchange_rate'],
            ] : null,
            
            'created_at' => isset($data['created_at']) ? (is_string($data['created_at']) ? $data['created_at'] : $data['created_at']->toIso8601String()) : null,
            'formatted_date' => isset($data['created_at']) ? (is_string($data['created_at']) ? $data['created_at'] : $data['created_at']->format('Y-m-d H:i:s')) : null,
        ];
    }
}
