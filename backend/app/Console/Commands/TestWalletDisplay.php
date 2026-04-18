<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\CurrencyConversionService;
use App\Services\WalletService;
use Illuminate\Console\Command;

class TestWalletDisplay extends Command
{
    protected $signature = 'wallet:test-display {user_id?}';
    protected $description = 'Test wallet display for a user';

    public function handle(WalletService $walletService, CurrencyConversionService $currencyService): int
    {
        $userId = $this->argument('user_id');
        
        if (!$userId) {
            // Get first user with wallet
            $user = User::whereHas('wallet')->first();
            if (!$user) {
                $this->error('No users with wallets found!');
                return 1;
            }
        } else {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User not found: {$userId}");
                return 1;
            }
        }

        $this->info("Testing wallet display for user: {$user->name} ({$user->id})");
        $this->newLine();

        // Get wallet
        try {
            $wallet = $walletService->getWallet($user);
        } catch (\Exception $e) {
            $this->error("Failed to get wallet: {$e->getMessage()}");
            return 1;
        }

        // Display wallet info
        $this->info('=== WALLET INFO ===');
        $this->table(
            ['Field', 'Value'],
            [
                ['ID', $wallet->id],
                ['User ID', $wallet->user_id],
                ['Balance', $wallet->balance],
                ['Held Balance', $wallet->held_balance],
                ['Available Balance', $wallet->balance - $wallet->held_balance],
                ['Currency', $wallet->currency_code ?? 'EUR'],
                ['Created At', $wallet->created_at],
                ['Updated At', $wallet->updated_at],
            ]
        );

        $this->newLine();

        // Test currency conversion
        $this->info('=== CURRENCY CONVERSION TEST ===');
        $userCurrency = $user->currency_code ?? 'EUR';
        $this->info("User preferred currency: {$userCurrency}");
        
        try {
            $conversion = $currencyService->convertForUser(
                (float) $wallet->balance,
                $wallet->currency_code ?? 'EUR',
                $user
            );
            
            $this->table(
                ['Field', 'Value'],
                [
                    ['Amount', $conversion['amount']],
                    ['Currency', $conversion['currency']],
                    ['Formatted', $conversion['formatted']],
                    ['Original Amount', $conversion['original_amount'] ?? 'N/A'],
                    ['Original Currency', $conversion['original_currency'] ?? 'N/A'],
                    ['Exchange Rate', $conversion['exchange_rate'] ?? 'N/A'],
                ]
            );
        } catch (\Exception $e) {
            $this->error("Currency conversion failed: {$e->getMessage()}");
        }

        $this->newLine();

        // Display recent transactions
        $this->info('=== RECENT TRANSACTIONS ===');
        $transactions = $wallet->transactions()->orderBy('created_at', 'desc')->limit(5)->get();
        
        if ($transactions->isEmpty()) {
            $this->warn('No transactions found');
        } else {
            $this->table(
                ['ID', 'Type', 'Amount', 'Description', 'Created At'],
                $transactions->map(fn($t) => [
                    substr($t->id, 0, 8),
                    $t->type,
                    $t->amount,
                    substr($t->description, 0, 40),
                    $t->created_at->format('Y-m-d H:i:s'),
                ])->toArray()
            );
        }

        $this->newLine();

        // Simulate API response
        $this->info('=== SIMULATED API RESPONSE ===');
        $balanceConversion = $currencyService->convertForUser(
            (float) $wallet->balance,
            $wallet->currency_code ?? 'EUR',
            $user
        );
        
        $heldBalanceConversion = $currencyService->convertForUser(
            (float) $wallet->held_balance,
            $wallet->currency_code ?? 'EUR',
            $user
        );
        
        $availableBalance = (float) $wallet->balance - (float) $wallet->held_balance;
        $availableBalanceConversion = $currencyService->convertForUser(
            $availableBalance,
            $wallet->currency_code ?? 'EUR',
            $user
        );

        $apiResponse = [
            'success' => true,
            'data' => [
                'id' => $wallet->id,
                'user_id' => $wallet->user_id,
                'balance' => $balanceConversion['amount'],
                'currency_code' => $balanceConversion['currency'],
                'formatted_balance' => $balanceConversion['formatted'],
                'held_balance' => $heldBalanceConversion['amount'],
                'formatted_held_balance' => $heldBalanceConversion['formatted'],
                'available_balance' => $availableBalanceConversion['amount'],
                'formatted_available_balance' => $availableBalanceConversion['formatted'],
                'original_balance' => $balanceConversion['original_amount'] ?? null,
                'original_currency_code' => $balanceConversion['original_currency'] ?? null,
                'exchange_rate' => $balanceConversion['exchange_rate'] ?? null,
            ],
        ];

        $this->line(json_encode($apiResponse, JSON_PRETTY_PRINT));

        $this->newLine();
        $this->info('✓ Test completed successfully!');

        return 0;
    }
}
