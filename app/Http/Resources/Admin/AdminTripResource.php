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
            'origin' => "{$this->origin_city}, {$this->origin_country}",
            'destination' => "{$this->destination_city}, {$this->destination_country}",
            'origin_city' => $this->origin_city,
            'origin_country' => $this->origin_country,
            'destination_city' => $this->destination_city,
            'destination_country' => $this->destination_country,
            'departure_date' => $this->departure_date,
            'arrival_date' => $this->arrival_date,
            'available_space' => $this->available_space,
            'price_per_kg' => $this->price_per_kg,
            'status' => $this->status,
            'shipments_count' => $this->whenLoaded('shipments', fn() => $this->shipments->count(), 0),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
