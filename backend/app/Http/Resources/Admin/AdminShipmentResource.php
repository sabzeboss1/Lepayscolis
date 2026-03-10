<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminShipmentResource extends JsonResource
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
            'tracking_number' => $this->tracking_number,
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'email' => $this->sender->email,
            ],
            'recipient' => [
                'name' => $this->recipient_name,
                'phone' => $this->recipient_phone,
                'address' => $this->recipient_address,
            ],
            'traveler' => $this->whenLoaded('traveler', [
                'id' => $this->traveler->id,
                'name' => $this->traveler->name,
                'email' => $this->traveler->email,
            ]),
            'trip' => $this->whenLoaded('trip', [
                'id' => $this->trip->id,
                'origin_city' => $this->trip->origin_city,
                'destination_city' => $this->trip->destination_city,
                'departure_date' => $this->trip->departure_date,
            ]),
            'package_description' => $this->package_description,
            'package_weight' => $this->package_weight,
            'package_value' => $this->package_value,
            'price' => $this->price,
            'status' => $this->status,
            'payment' => $this->whenLoaded('payment', [
                'id' => $this->payment->id,
                'amount' => $this->payment->amount,
                'status' => $this->payment->status,
            ]),
            'status_history' => $this->when(isset($this->status_history), $this->status_history),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
