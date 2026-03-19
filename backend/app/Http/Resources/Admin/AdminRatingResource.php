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
            'from_user' => $this->when($this->relationLoaded('fromUser') && $this->fromUser, [
                'id' => $this->fromUser?->id,
                'name' => $this->fromUser?->name,
                'email' => $this->fromUser?->email,
                'phone' => $this->fromUser?->phone,
                'rating' => $this->fromUser?->rating,
            ]),
            'to_user' => $this->when($this->relationLoaded('toUser') && $this->toUser, [
                'id' => $this->toUser?->id,
                'name' => $this->toUser?->name,
                'email' => $this->toUser?->email,
                'phone' => $this->toUser?->phone,
                'rating' => $this->toUser?->rating,
                'total_ratings' => $this->when($this->relationLoaded('toUser'), function () {
                    return $this->toUser?->ratingsReceived()->count() ?? 0;
                }),
            ]),
            'shipment' => $this->when($this->relationLoaded('shipment') && $this->shipment, [
                'id' => $this->shipment?->id,
                'description' => $this->shipment?->package_description,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
