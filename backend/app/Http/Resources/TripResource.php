<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * TripResource - Transform trip model to JSON
 * 
 * Includes:
 * - All trip fields
 * - Traveler data using UserResource (whenLoaded)
 * - Dates formatted as ISO 8601
 * 
 * Validates Requirements: 3.12, 12.14-12.15
 */
class TripResource extends JsonResource
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
            'traveler_id' => $this->traveler_id,
            'departure_city' => $this->departure_city,
            'departure_country' => $this->departure_country,
            'departure' => [
                'country_id' => $this->departure_country_id,
                'country_code' => $this->whenLoaded('departureCountry', fn() => $this->departureCountry?->code),
                'country_name' => $this->whenLoaded('departureCountry', fn() => $this->departureCountry?->name),
                'city_id' => $this->departure_city_id,
                'city_name' => $this->whenLoaded('departureCity', fn() => $this->departureCity?->name),
            ],
            'departure_date' => $this->departure_date?->toISOString(),
            'arrival_city' => $this->arrival_city,
            'arrival_country' => $this->arrival_country,
            'arrival' => [
                'country_id' => $this->arrival_country_id,
                'country_code' => $this->whenLoaded('arrivalCountry', fn() => $this->arrivalCountry?->code),
                'country_name' => $this->whenLoaded('arrivalCountry', fn() => $this->arrivalCountry?->name),
                'city_id' => $this->arrival_city_id,
                'city_name' => $this->whenLoaded('arrivalCity', fn() => $this->arrivalCity?->name),
            ],
            'arrival_date' => $this->arrival_date?->toISOString(),
            'available_capacity' => $this->available_capacity,
            'price_per_kg' => $this->price_per_kg,
            'currency_code' => $this->currency_code,
            'accepted_package_types' => $this->accepted_package_types,
            'pickup_address' => $this->pickup_address,
            'delivery_address' => $this->delivery_address,
            'status' => $this->status,
            'travel_proof_url' => $this->travel_proof_url,
            'remaining_capacity' => $this->remainingCapacity(),
            'accepted_shipments_count' => $this->when(
                $this->relationLoaded('shipments'),
                fn() => $this->shipments->whereIn('status', ['accepted', 'in_transit', 'delivered'])->count()
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Include traveler data when loaded
            'traveler' => PublicUserResource::make($this->whenLoaded('traveler')),
        ];
    }
}
