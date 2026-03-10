<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        
        return [
            'id' => $this->id,
            'user1_id' => $this->user1_id,
            'user2_id' => $this->user2_id,
            'shipment_id' => $this->shipment_id,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'other_user' => new PublicUserResource($this->getOtherUser($user)),
            'last_message' => new MessageResource($this->whenLoaded('messages', function () {
                return $this->getLastMessage();
            })),
            'unread_count' => $this->when($user !== null, function () use ($user) {
                return $this->getUnreadCount($user);
            }),
        ];
    }
}
