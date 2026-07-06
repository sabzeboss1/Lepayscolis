<?php

namespace App\Http\Resources\Admin;

use App\Models\PlatformSetting;
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
        $currency = PlatformSetting::getDefaultCurrency();

        return [
            'id' => 'wallet_' . $this->id, // User ID for wallet identification
            'user' => [
                'id' => $this->id,
                'name' => $this->name,
                'email' => $this->email,
                'phone' => $this->phone ?? '',
            ],
            'wallet_id' => $this->wallet_id ?? null,
            'balance' => (float) ($this->balance ?? 0),
            'currency_code' => $currency,
            'balance_formatted' => number_format($this->balance ?? 0, 2) . ' ' . $currency,
            'total_credits' => (float) ($this->total_credits ?? 0),
            'total_debits' => (float) ($this->total_debits ?? 0),
            'last_transaction_at' => $this->last_transaction_at ?? null,
        ];
    }
}
