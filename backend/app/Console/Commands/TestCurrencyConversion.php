<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\CurrencyConversionService;
use Illuminate\Console\Command;

class TestCurrencyConversion extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:currency-conversion {user_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test currency conversion for a specific user';

    /**
     * Execute the console command.
     */
    public function handle(CurrencyConversionService $conversionService)
    {
        $userId = $this->argument('user_id');
        $user = User::find($userId);

        if (!$user) {
            $this->error("User with ID {$userId} not found.");
            return 1;
        }

        $this->info("Testing currency conversion for user: {$user->name}");
        $this->info("User preferred currency: {$user->currency_code}");

        // Test conversion from XAF to user's preferred currency
        $testAmount = 1000;
        $sourceCurrency = 'XAF';

        $this->info("\n--- Testing Conversion ---");
        $this->info("Converting {$testAmount} {$sourceCurrency} to {$user->currency_code}");

        try {
            $conversion = $conversionService->convertForUser($testAmount, $sourceCurrency, $user);
            
            $this->info("✅ Conversion successful:");
            $this->info("  Original: {$testAmount} {$sourceCurrency}");
            $this->info("  Converted: {$conversion['amount']} {$conversion['currency']}");
            $this->info("  Formatted: {$conversion['formatted']}");
            
            if (isset($conversion['exchange_rate'])) {
                $this->info("  Exchange rate: {$conversion['exchange_rate']}");
            }

            // Test wallet resource simulation
            $this->info("\n--- Simulating Wallet Resource ---");
            $wallet = $user->wallet;
            if ($wallet) {
                $walletConversion = $conversionService->convertForUser(
                    (float) $wallet->balance,
                    $wallet->currency_code ?? 'EUR',
                    $user
                );
                
                $this->info("Wallet balance conversion:");
                $this->info("  Original: {$wallet->balance} {$wallet->currency_code}");
                $this->info("  Converted: {$walletConversion['amount']} {$walletConversion['currency']}");
                $this->info("  Formatted: {$walletConversion['formatted']}");
            } else {
                $this->warn("User has no wallet.");
            }

        } catch (\Exception $e) {
            $this->error("❌ Conversion failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}