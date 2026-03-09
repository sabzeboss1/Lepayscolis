<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KYCDocumentResource extends JsonResource
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
            'user_id' => $this->user_id,
            'document_type' => $this->document_type,
            'document_front_url' => $this->document_front_url,
            'document_back_url' => $this->document_back_url,
            'selfie_url' => $this->selfie_url,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'reviewed_by' => $this->reviewed_by,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            
            // Relationships
            'user' => new UserResource($this->whenLoaded('user')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
        ];
    }
}
