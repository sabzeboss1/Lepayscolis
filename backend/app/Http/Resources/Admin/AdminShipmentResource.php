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
            'tracking_number' => strtoupper(substr(str_replace('-', '', $this->id), 0, 10)),
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'email' => $this->sender->email,
                'phone' => $this->sender->phone ?? null,
            ],
            'traveler' => $this->whenLoaded('traveler', fn() => [
                'id' => $this->traveler->id,
                'name' => $this->traveler->name,
                'email' => $this->traveler->email,
            ]),
            'trip' => $this->whenLoaded('trip', fn() => [
                'id' => $this->trip->id,
                'origin' => "{$this->trip->departure_city}, {$this->trip->departure_country}",
                'destination' => "{$this->trip->arrival_city}, {$this->trip->arrival_country}",
                'traveler_name' => $this->trip->traveler?->name,
                'departure_date' => $this->trip->departure_date,
            ]),
            'package_description' => $this->package_description,
            'package_weight' => $this->package_weight,
            'package_length' => $this->package_length,
            'package_width' => $this->package_width,
            'package_height' => $this->package_height,
            'pickup_city' => $this->pickup_city,
            'pickup_country' => $this->pickup_country,
            'pickup_address' => $this->pickup_address,
            'delivery_city' => $this->delivery_city,
            'delivery_country' => $this->delivery_country,
            'delivery_address' => $this->delivery_address,
            'pickup' => [
                'country_id' => $this->pickup_country_id,
                'country_code' => $this->whenLoaded('pickupCountry', fn() => $this->pickupCountry?->code),
                'country_name' => $this->whenLoaded('pickupCountry', fn() => $this->pickupCountry?->name),
                'city_id' => $this->pickup_city_id,
                'city_name' => $this->whenLoaded('pickupCity', fn() => $this->pickupCity?->name),
                'address' => $this->pickup_address,
            ],
            'delivery' => [
                'country_id' => $this->delivery_country_id,
                'country_code' => $this->whenLoaded('deliveryCountry', fn() => $this->deliveryCountry?->code),
                'country_name' => $this->whenLoaded('deliveryCountry', fn() => $this->deliveryCountry?->name),
                'city_id' => $this->delivery_city_id,
                'city_name' => $this->whenLoaded('deliveryCity', fn() => $this->deliveryCity?->name),
                'address' => $this->delivery_address,
            ],
            'status' => $this->status,
            'payment_amount' => $this->payment_amount,
            'payment_status' => $this->payment_status,
            'payment' => $this->whenLoaded('payment', fn() => [
                'id' => $this->payment->id,
                'amount' => $this->payment->amount,
                'status' => $this->payment->status,
            ]),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
