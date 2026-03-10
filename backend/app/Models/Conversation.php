<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user1_id',
        'user2_id',
        'shipment_id',
    ];

    protected $casts = [
        'user1_id' => 'integer',
        'user2_id' => 'integer',
        'shipment_id' => 'string',
    ];

    /**
     * Get the first user in the conversation.
     */
    public function user1(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user1_id');
    }

    /**
     * Get the second user in the conversation.
     */
    public function user2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user2_id');
    }

    /**
     * Get the shipment associated with the conversation.
     */
    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    /**
     * Get all messages in the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the other user in the conversation.
     */
    public function getOtherUser(User $user): User
    {
        return $this->user1_id === $user->id ? $this->user2 : $this->user1;
    }

    /**
     * Get the last message in the conversation.
     */
    public function getLastMessage(): ?Message
    {
        return $this->messages()->latest()->first();
    }

    /**
     * Get the unread message count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return $this->messages()
            ->where('recipient_id', $user->id)
            ->where('read', false)
            ->count();
    }
}
