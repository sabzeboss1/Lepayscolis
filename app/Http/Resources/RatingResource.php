<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RatingResource extends JsonResource
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
            'from_user_id' => $this->from_user_id,
            'to_user_id' => $this->to_user_id,
            'shipment_id' => $this->shipment_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relationships (loaded conditionally)
            'from_user' => new PublicUserResource($this->whenLoaded('fromUser')),
            'to_user' => new PublicUserResource($this->whenLoaded('toUser')),
            'shipment' => new ShipmentResource($this->whenLoaded('shipment')),
        ];
    }
}
