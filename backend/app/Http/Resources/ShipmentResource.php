<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ShipmentResource - Transform shipment model to JSON
 * 
 * Includes:
 * - All shipment fields
 * - Sender data using PublicUserResource (whenLoaded)
 * - Traveler data using PublicUserResource (whenLoaded)
 * - Trip data using TripResource (whenLoaded)
 * - Dates formatted as ISO 8601
 * 
 * Validates Requirements: 4.15, 12.14-12.15
 */
class ShipmentResource extends JsonResource
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
            'sender_id' => $this->sender_id,
            'traveler_id' => $this->traveler_id,
            'trip_id' => $this->trip_id,
            'package_description' => $this->package_description,
            'package_weight' => $this->package_weight,
            'package_length' => $this->package_length,
            'package_width' => $this->package_width,
            'package_height' => $this->package_height,
            'pickup_city' => $this->pickup_city,
            'pickup_country' => $this->pickup_country,
            'pickup' => [
                'country_id' => $this->pickup_country_id,
                'country_code' => $this->whenLoaded('pickupCountry', fn() => $this->pickupCountry?->code),
                'country_name' => $this->whenLoaded('pickupCountry', fn() => $this->pickupCountry?->name),
                'city_id' => $this->pickup_city_id,
                'city_name' => $this->whenLoaded('pickupCity', fn() => $this->pickupCity?->name),
                'address' => $this->pickup_address,
            ],
            'pickup_address' => $this->pickup_address,
            'delivery_city' => $this->delivery_city,
            'delivery_country' => $this->delivery_country,
            'delivery' => [
                'country_id' => $this->delivery_country_id,
                'country_code' => $this->whenLoaded('deliveryCountry', fn() => $this->deliveryCountry?->code),
                'country_name' => $this->whenLoaded('deliveryCountry', fn() => $this->deliveryCountry?->name),
                'city_id' => $this->delivery_city_id,
                'city_name' => $this->whenLoaded('deliveryCity', fn() => $this->deliveryCity?->name),
                'address' => $this->delivery_address,
            ],
            'delivery_address' => $this->delivery_address,
            'status' => $this->status,
            'payment_amount' => $this->payment_amount,
            'price' => $this->payment_amount, // Alias pour le frontend
            'payment_status' => $this->payment_status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Include relationships when loaded
            'sender' => $this->whenLoaded('sender', fn() => PublicUserResource::make($this->sender)->resolve()),
            'traveler' => $this->whenLoaded('traveler', fn() => PublicUserResource::make($this->traveler)->resolve()),
            'trip' => $this->whenLoaded('trip', fn() => TripResource::make($this->trip)->resolve()),
        ];
    }
}
