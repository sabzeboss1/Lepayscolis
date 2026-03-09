<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class KYCSubmissionResource extends JsonResource
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
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ],
            'document_type' => $this->document_type,
            'document_number' => $this->document_number,
            'document_front_url' => $this->document_front_path ? Storage::url($this->document_front_path) : null,
            'document_back_url' => $this->document_back_path ? Storage::url($this->document_back_path) : null,
            'selfie_url' => $this->selfie_path ? Storage::url($this->selfie_path) : null,
            'status' => $this->status,
            'rejection_reason' => $this->when($this->status === 'rejected', $this->rejection_reason),
            'submitted_at' => $this->created_at->toIso8601String(),
            'reviewed_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
