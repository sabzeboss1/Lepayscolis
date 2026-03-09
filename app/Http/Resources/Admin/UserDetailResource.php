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
            'average_rating' => $this->average_rating ? round($this->average_rating, 2) : null,
            'total_ratings' => $this->total_ratings ?? 0,
            'last_login' => $this->last_login?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'messaging_banned' => $this->messaging_banned,
            'messaging_ban_reason' => $this->when($this->messaging_banned, $this->messaging_ban_reason),
            
            // Activity history
            'activity' => $this->when(isset($this->activity), $this->activity),
            
            // Trips
            'trips_count' => $this->when(isset($this->trips_count), $this->trips_count),
            'trips' => $this->when(isset($this->trips), $this->trips),
            
            // Shipments
            'shipments_count' => $this->when(isset($this->shipments_count), $this->shipments_count),
            'shipments' => $this->when(isset($this->shipments), $this->shipments),
            
            // Transactions
            'transactions' => $this->when(isset($this->transactions), $this->transactions),
        ];
    }
}
