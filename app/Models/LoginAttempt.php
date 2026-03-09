<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LoginAttempt extends Model
{
    const UPDATED_AT = null; // No updated_at column
    const CREATED_AT = 'attempted_at'; // Use attempted_at as created_at

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'ip_address',
        'success',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'success' => 'boolean',
        'attempted_at' => 'datetime',
    ];

    /**
     * Record a login attempt.
     *
     * @param string $email
     * @param string $ipAddress
     * @param bool $success
     * @return self
     */
    public static function recordAttempt(string $email, string $ipAddress, bool $success): self
    {
        return self::create([
            'email' => $email,
            'ip_address' => $ipAddress,
            'success' => $success,
        ]);
    }

    /**
     * Get failed attempts count for an IP in the last X minutes.
     *
     * @param string $ipAddress
     * @param int $minutes
     * @return int
     */
    public static function failedAttemptsCount(string $ipAddress, int $minutes = 15): int
    {
        return self::where('ip_address', $ipAddress)
            ->where('success', false)
            ->where('attempted_at', '>=', Carbon::now()->subMinutes($minutes))
            ->count();
    }
}
