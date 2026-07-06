<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustBalanceRequest;
use App\Http\Resources\WalletAuditLogResource;
use App\Http\Resources\WalletResource;
use App\Http\Resources\WalletTransactionResource;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletAuditLog;
use App\Services\CurrencyService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletManagementController extends Controller
{
    public function __construct(
        private WalletService $walletService,
        private CurrencyService $currencyService
    ) {
        // Auth and admin middleware applied at route level in api.php
    }

    /**
     * List all wallets with search and filters
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 20);

        $query = Wallet::with('user');

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        $wallets = $query->paginate($perPage);

        // Transform wallets with aggregated data
        $transformedWallets = $wallets->map(function ($wallet) {
            // Skip wallets without users (orphaned wallets)
            if (!$wallet->user) {
                return null;
            }

            $totalCredits = $wallet->transactions()
                ->whereIn('type', ['credit', 'refund'])
                ->sum('amount');
            
            $totalDebits = abs($wallet->transactions()
                ->where('type', 'debit')
                ->sum('amount'));
            
            $lastTransaction = $wallet->transactions()
                ->latest('created_at')
                ->first();

            return [
                'id' => $wallet->id,
                'user' => [
                    'id' => $wallet->user->id,
                    'name' => $wallet->user->name,
                    'email' => $wallet->user->email,
                    'phone' => $wallet->user->phone ?? '',
                ],
                'balance' => (float) $wallet->balance,
                'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                'total_credits' => (float) $totalCredits,
                'total_debits' => (float) $totalDebits,
                'last_transaction_at' => $lastTransaction?->created_at?->toIso8601String(),
            ];
        })->filter();

        return response()->json([
            'success' => true,
            'data' => $transformedWallets,
            'meta' => [
                'current_page' => $wallets->currentPage(),
                'last_page' => $wallets->lastPage(),
                'per_page' => $wallets->perPage(),
                'total' => $wallets->total(),
            ],
        ]);
    }

    /**
     * Get specific user's wallet details with aggregated totals
     */
    public function show(Request $request, string $userId): JsonResponse
    {
        $user = User::with('wallet')->find($userId);

        if (!$user || !$user->wallet) {
            return response()->json([
                'success' => false,
                'message' => 'User wallet not found',
            ], 404);
        }

        $wallet = $user->wallet;
        $perPage = $request->input('per_page', 25);

        // Calculate aggregated totals
        $totalCredits = $wallet->transactions()
            ->whereIn('type', ['credit', 'refund'])
            ->sum('amount');

        $totalDebits = $wallet->transactions()
            ->where('type', 'debit')
            ->sum('amount');

        // Paginated transactions
        $transactions = $wallet->transactions()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'wallet' => [
                    'id' => $wallet->id,
                    'user_id' => $wallet->user_id,
                    'balance' => (float) $wallet->balance,
                    'held_balance' => (float) $wallet->held_balance,
                    'available_balance' => (float) $wallet->balance - (float) $wallet->held_balance,
                    'currency_code' => $wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                ],
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
                'aggregates' => [
                    'total_credits' => (float) $totalCredits,
                    'total_debits' => (float) abs($totalDebits),
                ],
                'transactions' => WalletTransactionResource::collection($transactions),
            ],
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Manually adjust wallet balance
     */
    public function adjustBalance(AdjustBalanceRequest $request, string $userId): JsonResponse
    {
        $user = User::with('wallet')->find($userId);

        if (!$user || !$user->wallet) {
            return response()->json([
                'success' => false,
                'message' => 'User wallet not found',
            ], 404);
        }

        $amount = abs($request->input('amount'));
        $type = $request->input('type');
        $reason = $request->input('reason');
        $admin = $request->user();

        // Use system default currency from platform settings
        $systemCurrencyCode = PlatformSetting::getDefaultCurrency();
        $walletCurrencyCode = $user->wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency();

        // Convert amount if system currency differs from wallet currency
        $originalAmount = $amount;
        $originalCurrencyCode = $systemCurrencyCode;
        $exchangeRateUsed = null;

        if ($systemCurrencyCode !== $walletCurrencyCode) {
            $conversion = $this->currencyService->convert($amount, $systemCurrencyCode, $walletCurrencyCode);
            $amount = $conversion['converted_amount'];
            $exchangeRateUsed = $conversion['exchange_rate'];
        }

        // Convert to negative if debit
        $adjustmentAmount = $type === 'debit' ? -$amount : $amount;

        try {
            $transaction = $this->walletService->adjustBalance(
                $user->wallet,
                $adjustmentAmount,
                $reason,
                $admin,
                $originalAmount,
                $originalCurrencyCode,
                $exchangeRateUsed
            );

            return response()->json([
                'success' => true,
                'message' => 'Wallet balance adjusted successfully',
                'data' => [
                    'wallet' => [
                        'id' => $user->wallet->id,
                        'user_id' => $user->wallet->user_id,
                        'balance' => (float) $user->wallet->fresh()->balance,
                        'held_balance' => (float) $user->wallet->held_balance,
                        'available_balance' => (float) $user->wallet->balance - (float) $user->wallet->held_balance,
                        'currency_code' => $user->wallet->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency(),
                    ],
                    'transaction' => new WalletTransactionResource($transaction),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get audit logs with filters
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $adminId = $request->input('admin_id');
        $action = $request->input('action');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $perPage = $request->input('per_page', 20);

        $query = WalletAuditLog::with('admin')
            ->orderBy('created_at', 'desc');

        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        if ($action) {
            $query->where('action', $action);
        }

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => WalletAuditLogResource::collection($logs->items()),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
