<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminNotification extends Model
{
    const UPDATED_AT = null; // No updated_at column
    const CREATED_AT = 'sent_at'; // Use sent_at as created_at

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sent_by',
        'recipient_type',
        'recipient_count',
        'title',
        'message',
        'group_filter',
        'sent_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'group_filter' => 'array',
        'sent_at' => 'datetime',
    ];

    /**
     * Get the admin user who sent the notification.
     */
    public function sentBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
