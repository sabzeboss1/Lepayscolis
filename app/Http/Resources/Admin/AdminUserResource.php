<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
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
            'last_login' => $this->last_login?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'messaging_banned' => $this->messaging_banned,
            'messaging_ban_reason' => $this->when($this->messaging_banned, $this->messaging_ban_reason),
        ];
    }
}
