<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminRatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'shipment_id' => $this->shipment_id,
            
            // Reviewer (person who gave the rating)
            'reviewer' => $this->when($this->relationLoaded('fromUser') && $this->fromUser, [
                'id' => $this->fromUser?->id,
                'name' => $this->fromUser?->name,
                'email' => $this->fromUser?->email,
                'phone' => $this->fromUser?->phone,
                'rating' => $this->fromUser?->rating,
            ]),
            
            // Reviewed user (person who received the rating)
            'reviewed_user' => $this->when($this->relationLoaded('toUser') && $this->toUser, [
                'id' => $this->toUser?->id,
                'name' => $this->toUser?->name,
                'email' => $this->toUser?->email,
                'phone' => $this->toUser?->phone,
                'rating' => $this->toUser?->rating,
                'total_ratings' => $this->when($this->relationLoaded('toUser'), function () {
                    return $this->toUser?->ratingsReceived()->count() ?? 0;
                }),
            ]),
            
            // Related resource (shipment)
            'related_resource' => $this->when($this->relationLoaded('shipment') && $this->shipment, [
                'type' => 'shipment',
                'id' => $this->shipment?->id,
                'reference' => $this->shipment?->tracking_number ?? "SHP-{$this->shipment?->id}",
            ]),
            
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
