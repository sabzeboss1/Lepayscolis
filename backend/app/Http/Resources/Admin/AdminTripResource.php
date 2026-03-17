<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminTripResource extends JsonResource
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
            'traveler' => [
                'id' => $this->traveler->id,
                'name' => $this->traveler->name,
                'email' => $this->traveler->email,
                'average_rating' => $this->traveler->average_rating ? round($this->traveler->average_rating, 2) : null,
            ],
            'origin' => "{$this->departure_city}, {$this->departure_country}",
            'destination' => "{$this->arrival_city}, {$this->arrival_country}",
            'departure_city' => $this->departure_city,
            'departure_country' => $this->departure_country,
            'arrival_city' => $this->arrival_city,
            'arrival_country' => $this->arrival_country,
            'departure' => [
                'country_id' => $this->departure_country_id,
                'country_code' => $this->whenLoaded('departureCountry', fn() => $this->departureCountry?->code),
                'country_name' => $this->whenLoaded('departureCountry', fn() => $this->departureCountry?->name),
                'city_id' => $this->departure_city_id,
                'city_name' => $this->whenLoaded('departureCity', fn() => $this->departureCity?->name),
            ],
            'arrival' => [
                'country_id' => $this->arrival_country_id,
                'country_code' => $this->whenLoaded('arrivalCountry', fn() => $this->arrivalCountry?->code),
                'country_name' => $this->whenLoaded('arrivalCountry', fn() => $this->arrivalCountry?->name),
                'city_id' => $this->arrival_city_id,
                'city_name' => $this->whenLoaded('arrivalCity', fn() => $this->arrivalCity?->name),
            ],
            'departure_date' => $this->departure_date,
            'arrival_date' => $this->arrival_date,
            'available_capacity' => $this->available_capacity,
            'price_per_kg' => $this->price_per_kg,
            'currency_code' => $this->currency_code,
            'status' => $this->status,
            'shipments_count' => $this->whenLoaded('shipments', fn() => $this->shipments->count(), 0),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
