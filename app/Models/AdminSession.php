<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class AdminSession extends Model
{
    const UPDATED_AT = null; // No updated_at column

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'admin_id',
        'token',
        'ip_address',
        'user_agent',
        'last_activity',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_activity' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * Get the admin user for this session.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Check if the session is expired.
     *
     * @return bool
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Extend the session expiration by 8 hours.
     *
     * @return void
     */
    public function extend(): void
    {
        $this->update([
            'last_activity' => now(),
            'expires_at' => now()->addHours(8),
        ]);
    }
}
