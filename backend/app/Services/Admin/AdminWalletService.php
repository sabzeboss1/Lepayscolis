<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminWalletService
{
    public function getWallets(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        // Ensure all users have wallets
        $this->ensureUsersHaveWallets();

        // Join avec la table wallets pour obtenir les données du portefeuille
        $query = User::query()
            ->select([
                'users.*',
                'wallets.balance',
                'wallets.id as wallet_id',
            ])
            ->leftJoin('wallets', 'wallets.user_id', '=', 'users.id')
            ->selectSub(
                'SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) FROM wallet_transactions WHERE wallet_transactions.wallet_id = wallets.id',
                'total_credits'
            )
            ->selectSub(
                'SELECT COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) FROM wallet_transactions WHERE wallet_transactions.wallet_id = wallets.id',
                'total_debits'
            )
            ->selectSub(
                'SELECT MAX(created_at) FROM wallet_transactions WHERE wallet_transactions.wallet_id = wallets.id',
                'last_transaction_at'
            );

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $sort = $filters['sort'] ?? 'balance';
        if ($sort === 'balance') {
            $query->orderByRaw('COALESCE(wallets.balance, 0) DESC');
        } else {
            $query->orderBy('users.created_at', 'desc');
        }

        return $query->paginate($perPage);
    }

    /**
     * Ensure all users have wallets
     */
    private function ensureUsersHaveWallets(): void
    {
        try {
            $usersWithoutWallets = User::whereDoesntHave('wallet')->get();
            $currency = \App\Models\PlatformSetting::get('default_currency', 'XAF');

            foreach ($usersWithoutWallets as $user) {
                \App\Models\Wallet::create([
                    'user_id' => $user->id,
                    'balance' => 0.00,
                    'currency_code' => $currency,
                    'held_balance' => 0.00,
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('ensureUsersHaveWallets failed: ' . $e->getMessage());
        }
    }

    public function getWalletDetails(int $userId): array
    {
        $user = User::findOrFail($userId);
        $wallet = $user->wallet;
        $walletId = $wallet?->id;

        $transactions = DB::table('wallet_transactions')
            ->where('wallet_id', $walletId)
            ->latest('created_at')
            ->paginate(50);

        $balance = $wallet?->balance ?? 0;

        $totals = [
            'credits' => DB::table('wallet_transactions')
                ->where('wallet_id', $walletId)
                ->where('amount', '>', 0)
                ->sum('amount'),
            'debits' => abs(DB::table('wallet_transactions')
                ->where('wallet_id', $walletId)
                ->where('amount', '<', 0)
                ->sum('amount')),
        ];

        return [
            'user' => $user,
            'balance' => $balance,
            'transactions' => $transactions,
            'totals' => $totals,
        ];
    }

    public function adjustBalance(int $userId, float $amount, string $reason, string $type, User $admin): void
    {
        $user = User::findOrFail($userId);
        $wallet = $user->wallet;

        if (!$wallet) {
            throw new \Exception('User does not have a wallet.');
        }

        $adjustmentAmount = $type === 'debit' ? -abs($amount) : abs($amount);

        $currentBalance = (float) $wallet->balance;

        if ($currentBalance + $adjustmentAmount < 0) {
            throw new \Exception('Adjustment would result in negative balance.');
        }

        DB::transaction(function () use ($wallet, $adjustmentAmount, $reason, $admin, $userId, $currentBalance) {
            $newBalance = $currentBalance + $adjustmentAmount;

            // Create wallet transaction
            DB::table('wallet_transactions')->insert([
                'wallet_id' => $wallet->id,
                'amount' => $adjustmentAmount,
                'type' => 'adjustment',
                'description' => $reason,
                'balance_after' => $newBalance,
                'created_at' => now(),
            ]);

            // Update wallet balance
            $wallet->update(['balance' => $newBalance]);

            // Create audit log
            AuditLog::log($admin, 'adjust_balance', 'wallet', $userId,
                ['amount' => $currentBalance],
                ['amount' => $newBalance, 'reason' => $reason]
            );
        });
    }
}
