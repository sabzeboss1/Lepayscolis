<?php

namespace App\Http\Resources\Admin;

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
        return [
            'user' => [
                'id' => $this->id,
                'name' => $this->name,
                'email' => $this->email,
            ],
            'balance' => $this->balance ?? 0,
            'balance_formatted' => number_format($this->balance ?? 0, 2) . ' USD',
            'total_credits' => $this->when(isset($this->total_credits), $this->total_credits),
            'total_debits' => $this->when(isset($this->total_debits), $this->total_debits),
            'transaction_count' => $this->when(isset($this->transaction_count), $this->transaction_count),
        ];
    }
}
