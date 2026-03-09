<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletAuditLogResource extends JsonResource
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
            'admin' => [
                'id' => $this->admin?->id,
                'name' => $this->admin?->name,
                'email' => $this->admin?->email,
            ],
            'action' => $this->action,
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'reason' => $this->reason,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'formatted_date' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
