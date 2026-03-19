<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currency = $this->currency_code ?? 'EUR';

        return [
            'id' => $this->id,
            'user' => $this->when($this->relationLoaded('payer') && $this->payer, [
                'id' => $this->payer?->id,
                'name' => $this->payer?->name,
                'email' => $this->payer?->email,
                'phone' => $this->payer?->phone,
            ]),
            'payee' => $this->when($this->relationLoaded('payee') && $this->payee, [
                'id' => $this->payee?->id,
                'name' => $this->payee?->name,
                'email' => $this->payee?->email,
            ]),
            'amount' => (float) $this->amount,
            'base_amount' => (float) ($this->base_amount ?? $this->amount),
            'sender_fee' => (float) ($this->sender_fee ?? 0),
            'traveler_fee' => (float) ($this->traveler_fee ?? 0),
            'platform_fee' => (float) ($this->platform_fee ?? 0),
            'traveler_amount' => (float) ($this->traveler_amount ?? 0),
            'currency' => $currency,
            'amount_formatted' => number_format($this->amount, 2) . ' ' . $currency,
            'payment_method' => $this->payment_method,
            'transaction_id' => $this->transaction_id,
            'status' => $this->status,
            'shipment' => $this->when($this->relationLoaded('shipment') && $this->shipment, function () {
                return [
                    'id' => $this->shipment->id,
                    'tracking_number' => $this->shipment->tracking_number ?? null,
                    'status' => $this->shipment->status ?? null,
                ];
            }),
            'escrowed_at' => $this->escrowed_at?->toIso8601String(),
            'released_at' => $this->released_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
