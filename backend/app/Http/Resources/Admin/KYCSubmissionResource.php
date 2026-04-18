<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KYCSubmissionResource extends JsonResource
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
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ],
            'document_type' => $this->document_type,
            'document_number' => $this->id,
            'status' => $this->status,
            'rejection_reason' => $this->when($this->status === 'rejected', $this->rejection_reason),
            'submitted_at' => $this->submitted_at ? $this->submitted_at->toIso8601String() : $this->created_at->toIso8601String(),
            'reviewed_at' => $this->reviewed_at ? $this->reviewed_at->toIso8601String() : null,
            // Documents array for frontend compatibility
            'documents' => [
                [
                    'id' => $this->id,
                    'type' => $this->document_type,
                    'front_url' => $this->buildFileUrl($this->document_front_url, $baseUrl),
                    'back_url' => $this->buildFileUrl($this->document_back_url, $baseUrl),
                    'selfie_url' => $this->buildFileUrl($this->selfie_url, $baseUrl),
                ]
            ],
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
