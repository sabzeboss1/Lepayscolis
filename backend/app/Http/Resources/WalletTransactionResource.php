<?php

namespace App\Http\Resources;

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
        return [
            'id' => $this->id,
            'wallet_id' => $this->wallet_id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'currency_code' => $this->currency_code ?? 'EUR',
            'formatted_amount' => app(\App\Services\CurrencyService::class)->format(
                (float) $this->amount,
                $this->currency_code ?? 'EUR'
            ),
            'description' => $this->description,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'balance_after' => (float) $this->balance_after,
            'formatted_balance_after' => app(\App\Services\CurrencyService::class)->format(
                (float) $this->balance_after,
                $this->currency_code ?? 'EUR'
            ),
            'conversion' => $this->when($this->original_amount !== null, [
                'original_amount' => (float) $this->original_amount,
                'original_currency' => $this->original_currency_code,
                'exchange_rate' => (float) $this->exchange_rate_used,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'formatted_date' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
