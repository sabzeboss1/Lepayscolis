<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class KYCSubmissionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Helper function to generate KYC file URL (signed for browser access)
        $generateFileUrl = function($url) {
            if (!$url) return null;

            // If it's already a full URL (S3), return as is
            if (str_starts_with($url, 'http')) {
                return $url;
            }

            // For local storage, generate a temporary signed URL (valid 1 hour)
            if (preg_match('#kyc/(\d+)/(.+)$#', $url, $matches)) {
                $userId = $matches[1];
                $filename = $matches[2];
                return URL::temporarySignedRoute('admin.kyc.file', now()->addHour(), [
                    'userId' => $userId,
                    'filename' => $filename,
                ]);
            }

            return $url;
        };
        
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ],
            'document_type' => $this->document_type,
            'document_number' => $this->id, // Using ID as document number for now
            'status' => $this->status,
            'rejection_reason' => $this->when($this->status === 'rejected', $this->rejection_reason),
            'submitted_at' => $this->submitted_at ? $this->submitted_at->toIso8601String() : $this->created_at->toIso8601String(),
            'reviewed_at' => $this->reviewed_at ? $this->reviewed_at->toIso8601String() : null,
            // Documents array for frontend compatibility
            'documents' => [
                [
                    'id' => $this->id,
                    'type' => $this->document_type,
                    'front_url' => $generateFileUrl($this->document_front_url),
                    'back_url' => $generateFileUrl($this->document_back_url),
                    'selfie_url' => $generateFileUrl($this->selfie_url),
                ]
            ],
        ];
    }
}
