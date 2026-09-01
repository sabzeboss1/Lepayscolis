<?php

namespace App\Services;

use App\Events\WalletBalanceAdjusted;
use App\Events\WalletCredited;
use App\Exceptions\InsufficientBalanceException;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletAuditLog;
use App\Models\WalletTransaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Cache TTL for wallet balance (5 minutes).
     */
    private const BALANCE_CACHE_TTL = 300;

    /**
     * Cache TTL for transaction history (10 minutes).
     */
    private const HISTORY_CACHE_TTL = 600;

    /**
     * Get wallet for a user.
     *
     * @param User $user
     * @return Wallet
     */
    public function getWallet(User $user): Wallet
    {
        return $user->wallet()->firstOrFail();
    }

    /**
     * Get wallet balance with caching (5 min TTL).
     *
     * @param User $user
     * @return float
     */
    public function getBalance(User $user): float
    {
        $cacheKey = "wallet_balance_{$user->id}";
        
        return Cache::remember($cacheKey, self::BALANCE_CACHE_TTL, function () use ($user) {
            return (float) $this->getWallet($user)->balance;
        });
    }

    /**
     * Credit wallet with transaction safety.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param string $description
     * @param string|null $referenceType
     * @param string|null $referenceId
     * @return WalletTransaction
     */
    public function credit(
        Wallet $wallet,
        float $amount,
        string $description,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?float $originalAmount = null,
        ?string $originalCurrencyCode = null,
        ?float $exchangeRateUsed = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $description, $referenceType, $referenceId, $originalAmount, $originalCurrencyCode, $exchangeRateUsed) {
            // Lock wallet row for update to prevent race conditions
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            // Update balance
            $wallet->balance += $amount;
            $wallet->save();

            // Create transaction record
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'description' => $description,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_after' => $wallet->balance,
                'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                'original_amount' => $originalAmount,
                'original_currency_code' => $originalCurrencyCode,
                'exchange_rate_used' => $exchangeRateUsed,
            ]);
            
            // Clear balance cache
            $this->clearBalanceCache($wallet->user_id);
            
            // Dispatch event for notifications
            event(new WalletCredited($wallet, $transaction));
            
            return $transaction;
        });
    }

    /**
     * Debit wallet with validation and transaction safety.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param string $description
     * @param string|null $referenceType
     * @param string|null $referenceId
     * @return WalletTransaction
     * @throws InsufficientBalanceException
     */
    public function debit(
        Wallet $wallet,
        float $amount,
        string $description,
        ?string $referenceType = null,
        ?string $referenceId = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $description, $referenceType, $referenceId) {
            // Lock wallet row for update to prevent race conditions
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();
            
            // Validate sufficient balance
            if ($wallet->balance < $amount) {
                throw new InsufficientBalanceException($amount, $wallet->balance);
            }
            
            // Update balance
            $wallet->balance -= $amount;
            $wallet->save();
            
            // Create transaction record
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'description' => $description,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_after' => $wallet->balance,
                'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
            ]);

            // Clear balance cache
            $this->clearBalanceCache($wallet->user_id);

            return $transaction;
        });
    }

    /**
     * Adjust wallet balance (admin operation).
     *
     * @param Wallet $wallet
     * @param float $amount Positive for increase, negative for decrease
     * @param string $reason
     * @param User $admin
     * @return WalletTransaction
     * @throws InsufficientBalanceException
     */
    public function adjustBalance(
        Wallet $wallet,
        float $amount,
        string $reason,
        User $admin,
        ?float $originalAmount = null,
        ?string $originalCurrencyCode = null,
        ?float $exchangeRateUsed = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $reason, $admin, $originalAmount, $originalCurrencyCode, $exchangeRateUsed) {
            // Lock wallet row for update
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();
            
            // Validate that negative adjustment won't cause negative balance
            if ($amount < 0 && $wallet->balance < abs($amount)) {
                throw new InsufficientBalanceException(abs($amount), $wallet->balance);
            }
            
            // Update balance
            $wallet->balance += $amount;
            $wallet->save();
            
            // Create transaction record
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $amount >= 0 ? 'credit' : 'debit',
                'amount' => abs($amount),
                'description' => "Admin adjustment: {$reason}",
                'reference_type' => 'admin',
                'reference_id' => $admin->id,
                'balance_after' => $wallet->balance,
                'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                'original_amount' => $originalAmount,
                'original_currency_code' => $originalCurrencyCode,
                'exchange_rate_used' => $exchangeRateUsed,
            ]);

            // Create audit log entry
            WalletAuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'balance_adjusted',
                'target_type' => 'wallet',
                'target_id' => $wallet->id,
                'reason' => $reason,
                'metadata' => json_encode([
                    'amount' => $amount,
                    'original_amount' => $originalAmount,
                    'original_currency_code' => $originalCurrencyCode,
                    'exchange_rate_used' => $exchangeRateUsed,
                    'previous_balance' => $wallet->balance - $amount,
                    'new_balance' => $wallet->balance,
                    'user_id' => $wallet->user_id,
                ]),
            ]);
            
            // Clear balance cache
            $this->clearBalanceCache($wallet->user_id);
            
            // Dispatch event for notifications
            event(new WalletBalanceAdjusted($wallet, $transaction, $admin, $reason));
            
            return $transaction;
        });
    }

    /**
     * Get transaction history with pagination and filters.
     *
     * @param Wallet $wallet
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getTransactionHistory(Wallet $wallet, array $filters = []): LengthAwarePaginator
    {
        $query = $wallet->transactions()->orderBy('created_at', 'desc');
        
        // Filter by transaction type
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        
        // Filter by date range
        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        
        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }
        
        $perPage = $filters['per_page'] ?? 50;
        
        // Ne pas mettre en cache les objets Eloquent paginés car cela cause des problèmes de sérialisation
        return $query->paginate($perPage);
    }

    /**
     * Calculate running balance for transaction collection.
     *
     * @param Collection $transactions
     * @return Collection
     */
    public function calculateRunningBalance(Collection $transactions): Collection
    {
        // Transactions already have balance_after, so just return them
        // This method is here for compatibility and future enhancements
        return $transactions;
    }

    /**
     * Validate sufficient balance.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @return bool
     */
    public function validateSufficientBalance(Wallet $wallet, float $amount): bool
    {
        return $wallet->balance >= $amount;
    }

    /**
     * Hold (block) funds in wallet for a shipment.
     * Funds are moved from available balance to held_balance.
     *
     * @param Wallet $wallet
     * @param float $amount Amount to hold in wallet's currency
     * @param string $description
     * @param string|null $referenceType
     * @param string|null $referenceId
     * @param float|null $originalAmount Original amount before conversion
     * @param string|null $originalCurrencyCode Original currency before conversion
     * @param float|null $exchangeRateUsed Exchange rate used for conversion
     * @return WalletTransaction
     * @throws InsufficientBalanceException
     */
    public function hold(
        Wallet $wallet,
        float $amount,
        string $description,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?float $originalAmount = null,
        ?string $originalCurrencyCode = null,
        ?float $exchangeRateUsed = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $description, $referenceType, $referenceId, $originalAmount, $originalCurrencyCode, $exchangeRateUsed) {
            // Lock wallet row for update to prevent race conditions
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();
            
            // Calculate available balance (balance - held_balance)
            $availableBalance = $wallet->balance - $wallet->held_balance;
            
            // Validate sufficient available balance
            if ($availableBalance < $amount) {
                throw new InsufficientBalanceException($amount, $availableBalance);
            }
            
            // Increase held_balance (funds are blocked but not debited yet)
            $wallet->held_balance += $amount;
            $wallet->save();
            
            // Create transaction record with currency conversion info
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'hold',
                'amount' => $amount,
                'description' => $description,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_after' => $wallet->balance,
                'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                'original_amount' => $originalAmount,
                'original_currency_code' => $originalCurrencyCode,
                'exchange_rate_used' => $exchangeRateUsed,
            ]);
            
            // Clear balance cache
            $this->clearBalanceCache($wallet->user_id);
            
            return $transaction;
        });
    }

    /**
     * Release held funds and debit wallet (when shipment is confirmed).
     * This moves funds from held_balance and debits the actual balance.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param string $description
     * @param string|null $referenceType
     * @param string|null $referenceId
     * @return WalletTransaction
     */
    public function releaseAndDebit(
        Wallet $wallet,
        float $amount,
        string $description,
        ?string $referenceType = null,
        ?string $referenceId = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $description, $referenceType, $referenceId) {
            // Lock wallet row for update
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            // Validate sufficient held balance
            if ($wallet->held_balance < $amount) {
                throw new \Exception("Insufficient held balance. Required: {$amount}, Available: {$wallet->held_balance}");
            }

            // Decrease held_balance and actual balance
            $wallet->held_balance -= $amount;
            $wallet->balance -= $amount;
            $wallet->save();

            // Create transaction record
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'description' => $description,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_after' => $wallet->balance,
                'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
            ]);

            // Clear balance cache
            $this->clearBalanceCache($wallet->user_id);

            return $transaction;
        });
    }

    /**
     * Cancel hold and release funds back to available balance.
     * Used when shipment is cancelled before confirmation.
     *
     * @param Wallet $wallet
     * @param float $amount
     * @param string $description
     * @param string|null $referenceType
     * @param string|null $referenceId
     * @return WalletTransaction
     */
    public function cancelHold(
        Wallet $wallet,
        float $amount,
        string $description,
        ?string $referenceType = null,
        ?string $referenceId = null
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $description, $referenceType, $referenceId) {
            // Lock wallet row for update
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            // Validate sufficient held balance
            if ($wallet->held_balance < $amount) {
                throw new \Exception("Insufficient held balance to cancel. Required: {$amount}, Available: {$wallet->held_balance}");
            }

            // Decrease held_balance (funds return to available balance)
            $wallet->held_balance -= $amount;
            $wallet->save();

            // Create transaction record
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'hold_cancelled',
                'amount' => $amount,
                'description' => $description,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_after' => $wallet->balance,
                'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
            ]);

            // Clear balance cache
            $this->clearBalanceCache($wallet->user_id);

            return $transaction;
        });
    }

    /**
     * Get available balance (balance - held_balance).
     *
     * @param Wallet $wallet
     * @return float
     */
    public function getAvailableBalance(Wallet $wallet): float
    {
        return $wallet->balance - $wallet->held_balance;
    }

    /**
     * Clear balance cache for a user.
     *
     * @param string $userId
     * @return void
     */
    private function clearBalanceCache(string $userId): void
    {
        Cache::forget("wallet_balance_{$userId}");
    }
}
