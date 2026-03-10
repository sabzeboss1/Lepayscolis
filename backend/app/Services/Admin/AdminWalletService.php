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
        $query = User::select('users.*', DB::raw('COALESCE(SUM(wallet_transactions.amount), 0) as balance'))
            ->leftJoin('wallet_transactions', 'users.id', '=', 'wallet_transactions.user_id')
            ->groupBy('users.id');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $sort = $filters['sort'] ?? 'balance';
        if ($sort === 'balance') {
            $query->orderBy('balance', 'desc');
        }

        return $query->paginate($perPage);
    }

    public function getWalletDetails(int $userId): array
    {
        $user = User::findOrFail($userId);

        $transactions = DB::table('wallet_transactions')
            ->where('user_id', $userId)
            ->latest('created_at')
            ->paginate(50);

        $balance = DB::table('wallet_transactions')
            ->where('user_id', $userId)
            ->sum('amount');

        $totals = [
            'credits' => DB::table('wallet_transactions')
                ->where('user_id', $userId)
                ->where('amount', '>', 0)
                ->sum('amount'),
            'debits' => abs(DB::table('wallet_transactions')
                ->where('user_id', $userId)
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

        $adjustmentAmount = $type === 'debit' ? -abs($amount) : abs($amount);

        // Check for negative balance
        $currentBalance = DB::table('wallet_transactions')
            ->where('user_id', $userId)
            ->sum('amount');

        if ($currentBalance + $adjustmentAmount < 0) {
            throw new \Exception('Adjustment would result in negative balance.');
        }

        DB::transaction(function () use ($userId, $adjustmentAmount, $reason, $admin) {
            // Create wallet transaction
            DB::table('wallet_transactions')->insert([
                'user_id' => $userId,
                'amount' => $adjustmentAmount,
                'type' => 'admin_adjustment',
                'description' => $reason,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create audit log
            AuditLog::log($admin, 'adjust_balance', 'wallet', $userId, 
                ['amount' => 0], 
                ['amount' => $adjustmentAmount, 'reason' => $reason]
            );
        });
    }
}
