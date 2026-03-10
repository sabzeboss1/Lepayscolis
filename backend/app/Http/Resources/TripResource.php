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
            'departure_date' => $this->departure_date?->toISOString(),
            'arrival_city' => $this->arrival_city,
            'arrival_country' => $this->arrival_country,
            'arrival_date' => $this->arrival_date?->toISOString(),
            'available_capacity' => $this->available_capacity,
            'price_per_kg' => $this->price_per_kg,
            'accepted_package_types' => $this->accepted_package_types,
            'pickup_address' => $this->pickup_address,
            'delivery_address' => $this->delivery_address,
            'status' => $this->status,
            'travel_proof_url' => $this->travel_proof_url,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Include traveler data when loaded
            'traveler' => PublicUserResource::make($this->whenLoaded('traveler')),
        ];
    }
}
