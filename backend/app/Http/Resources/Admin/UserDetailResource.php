<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserDetailResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'status' => $this->deleted_at ? 'suspended' : 'active',
            'kyc_status' => $this->kyc_status,
            'rating' => $this->rating ?? 0,
            'completed_deliveries' => $this->completed_deliveries ?? 0,
            'is_recommended' => $this->is_recommended ?? false,
            'last_login' => $this->last_login?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'messaging_banned' => $this->messaging_banned ?? false,
            'messaging_ban_reason' => $this->when($this->messaging_banned, $this->messaging_ban_reason),
            
            // Trips
            'trips_count' => $this->when(isset($this->trips_count), $this->trips_count),
            'trips' => $this->when($this->relationLoaded('trips'), $this->trips),
            
            // Shipments
            'shipments_count' => $this->when(isset($this->shipments_count), $this->shipments_count),
            'shipments_as_sender' => $this->when($this->relationLoaded('shipmentsAsSender'), $this->shipmentsAsSender),
            'shipments_as_traveler' => $this->when($this->relationLoaded('shipmentsAsTraveler'), $this->shipmentsAsTraveler),
            
            // KYC Documents
            'kyc_documents' => $this->when($this->relationLoaded('kycDocuments'), $this->kycDocuments),
        ];
    }
}
