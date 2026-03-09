<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * PublicUserResource - Transform user model to JSON with only public fields
 * 
 * This resource excludes sensitive fields (email, phone, kyc_status, locale).
 * Use for displaying other users' profiles.
 * 
 * Validates Requirements: 10.1, 10.2, 12.14
 */
class PublicUserResource extends JsonResource
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
            'avatar' => $this->avatar,
            'rating' => $this->rating,
            'completed_deliveries' => $this->completed_deliveries,
            'is_recommended' => $this->is_recommended,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
