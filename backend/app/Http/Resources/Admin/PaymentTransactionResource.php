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
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'amount' => $this->amount,
            'amount_formatted' => number_format($this->amount, 2) . ' USD',
            'payment_method' => $this->payment_method,
            'stripe_payment_intent_id' => $this->stripe_payment_intent_id,
            'status' => $this->status,
            'shipment' => $this->whenLoaded('shipment', [
                'id' => $this->shipment->id,
                'tracking_number' => $this->shipment->tracking_number,
                'status' => $this->shipment->status,
            ]),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
