<?php

namespace App\Http\Resources\Admin;

use App\Models\PlatformSetting;
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
            'type' => $this->type,
            'amount' => $this->amount,
            'amount_formatted' => number_format($this->amount, 2) . ' ' . PlatformSetting::get('default_currency', 'EUR'),
            'description' => $this->description,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'balance_after' => $this->balance_after,
            'created_at' => $this->created_at->toIso8601String(),
            'created_at_formatted' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
