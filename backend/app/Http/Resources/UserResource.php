<?php

namespace App\Http\Resources;

use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserResource - Transform user model to JSON with all fields
 *
 * This resource includes all user fields including sensitive data.
 * Use for authenticated user's own profile.
 *
 * Validates Requirements: 10.3, 12.14
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar
                ? (str_starts_with($this->avatar, 'http') ? $this->avatar : asset('storage/' . $this->avatar))
                : null,
            'rating' => $this->rating,
            'completed_deliveries' => $this->completed_deliveries,
            'is_recommended' => $this->is_recommended,
            'kyc_status' => $this->kyc_status,
            'role' => $this->role,
            'locale' => $this->locale,
            'currency_code' => $this->currency_code,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        if ($this->role === 'super_admin') {
            $allowedEmails = array_filter(array_map('trim', explode(',', PlatformSetting::get('backup_notify_email', ''))));
            $data['has_backup_access'] = !empty($allowedEmails) && in_array($this->email, $allowedEmails);
        }

        return $data;
    }
}
