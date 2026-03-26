<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Wallet;

class UserObserver
{
    /**
     * Handle the User "saving" event.
     * Calculate is_recommended flag before saving.
     */
    public function saving(User $user): void
    {
        // Calculate is_recommended flag based on rating and completed_deliveries
        // User is recommended if rating >= 4.5 AND completed_deliveries >= 5
        $user->is_recommended = $user->rating >= 4.5 && $user->completed_deliveries >= 5;
    }

    /**
     * Handle the User "created" event.
     * Automatically create a wallet for the new user.
     */
    public function created(User $user): void
    {
        // Create wallet with initial balance of 0.00 in user's preferred currency
        Wallet::create([
            'user_id' => $user->id,
            'balance' => 0.00,
            'currency_code' => $user->currency_code ?? 'EUR',
            'held_balance' => 0.00,
        ]);
    }
}
