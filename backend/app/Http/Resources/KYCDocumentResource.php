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
        $baseUrl = $request->getSchemeAndHttpHost();

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'document_type' => $this->document_type,
            'document_front_url' => $this->buildFileUrl($this->document_front_url, $baseUrl),
            'document_back_url' => $this->buildFileUrl($this->document_back_url, $baseUrl),
            'selfie_url' => $this->buildFileUrl($this->selfie_url, $baseUrl),
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

    /**
     * Build full URL for a KYC file.
     */
    private function buildFileUrl(?string $path, string $baseUrl): ?string
    {
        if (!$path) {
            return null;
        }

        // Already a full URL (S3, etc.)
        if (str_starts_with($path, 'http')) {
            return $path;
        }

        // Strip leading /storage/ if present (legacy values)
        $cleanPath = preg_replace('#^/?storage/#', '', $path);

        return $baseUrl . '/storage/' . $cleanPath;
    }
}
