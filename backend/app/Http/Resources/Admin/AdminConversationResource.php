<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\MessageResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user1' => $this->when($this->relationLoaded('user1') && $this->user1, [
                'id' => $this->user1?->id,
                'name' => $this->user1?->name,
                'email' => $this->user1?->email,
                'messaging_banned' => (bool) $this->user1?->messaging_banned,
                'messaging_ban_reason' => $this->user1?->messaging_ban_reason,
            ]),
            'user2' => $this->when($this->relationLoaded('user2') && $this->user2, [
                'id' => $this->user2?->id,
                'name' => $this->user2?->name,
                'email' => $this->user2?->email,
                'messaging_banned' => (bool) $this->user2?->messaging_banned,
                'messaging_ban_reason' => $this->user2?->messaging_ban_reason,
            ]),
            'shipment_id' => $this->shipment_id,
            'messages_count' => $this->when(isset($this->messages_count), $this->messages_count),
            'last_message' => $this->when($this->relationLoaded('messages') && $this->messages->isNotEmpty(), function () {
                $lastMsg = $this->messages->sortByDesc('created_at')->first();
                return [
                    'content' => $lastMsg->content,
                    'created_at' => $lastMsg->created_at->toIso8601String(),
                ];
            }),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
