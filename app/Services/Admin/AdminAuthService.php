<?php

namespace App\Services\Admin;

use App\Models\AdminSession;
use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthService
{
    /**
     * Rate limit: max failed attempts allowed
     */
    const MAX_FAILED_ATTEMPTS = 5;

    /**
     * Rate limit: time window in minutes
     */
    const RATE_LIMIT_WINDOW = 15;

    /**
     * Rate limit: block duration in minutes
     */
    const BLOCK_DURATION = 30;

    /**
     * Session expiration in hours
     */
    const SESSION_EXPIRATION_HOURS = 8;

    /**
     * Authenticate admin user and create session.
     *
     * @param string $email
     * @param string $password
     * @param string $ipAddress
     * @param string|null $userAgent
     * @return array
     * @throws ValidationException
     */
    public function login(string $email, string $password, string $ipAddress, ?string $userAgent = null): array
    {
        // Check rate limiting
        $this->checkRateLimit($ipAddress);

        // Find user by email
        $user = User::where('email', $email)->first();

        // Validate credentials
        if (!$user || !Hash::check($password, $user->password)) {
            // Record failed attempt
            LoginAttempt::recordAttempt($email, $ipAddress, false);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user has admin role
        if (!$user->isAdmin()) {
            // Record failed attempt
            LoginAttempt::recordAttempt($email, $ipAddress, false);

            throw ValidationException::withMessages([
                'email' => ['You do not have admin access.'],
            ]);
        }

        // Record successful attempt
        LoginAttempt::recordAttempt($email, $ipAddress, true);

        // Create Sanctum token
        $token = $user->createToken('admin-token', ['admin'])->plainTextToken;

        // Create admin session
        $session = AdminSession::create([
            'admin_id' => $user->id,
            'token' => $token,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'last_activity' => now(),
            'expires_at' => now()->addHours(self::SESSION_EXPIRATION_HOURS),
        ]);

        return [
            'token' => $token,
            'user' => $user,
            'expires_at' => $session->expires_at->toIso8601String(),
        ];
    }

    /**
     * Logout admin user and invalidate session.
     *
     * @param User $user
     * @param string $token
     * @return void
     */
    public function logout(User $user, string $token): void
    {
        // Delete admin session
        AdminSession::where('admin_id', $user->id)
            ->where('token', $token)
            ->delete();

        // Revoke Sanctum token
        $user->tokens()->where('name', 'admin-token')->delete();
    }

    /**
     * Check rate limiting for login attempts.
     *
     * @param string $ipAddress
     * @return void
     * @throws ValidationException
     */
    protected function checkRateLimit(string $ipAddress): void
    {
        $failedAttempts = LoginAttempt::failedAttemptsCount($ipAddress, self::RATE_LIMIT_WINDOW);

        if ($failedAttempts >= self::MAX_FAILED_ATTEMPTS) {
            // Calculate retry after time
            $lastAttempt = LoginAttempt::where('ip_address', $ipAddress)
                ->where('success', false)
                ->latest('attempted_at')
                ->first();

            $retryAfter = $lastAttempt
                ? $lastAttempt->attempted_at->addMinutes(self::BLOCK_DURATION)->diffInSeconds(now())
                : self::BLOCK_DURATION * 60;

            throw ValidationException::withMessages([
                'email' => ['Too many login attempts. Please try again in ' . ceil($retryAfter / 60) . ' minutes.'],
            ])->status(429);
        }
    }
}
