<?php

namespace App\Console\Commands;

use App\Models\Currency;
use App\Services\CurrencyService;
use Illuminate\Console\Command;

class CheckCurrencyRates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:currency-rates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check current currency rates and test conversions';

    /**
     * Execute the console command.
     */
    public function handle(CurrencyService $currencyService)
    {
        $this->info("=== Currency Rates Check ===\n");

        // Get all active currencies
        $currencies = Currency::active()->orderBy('code')->get();

        if ($currencies->isEmpty()) {
            $this->error("No active currencies found. Please run the currency seeder.");
            return 1;
        }

        $this->info("Active currencies:");
        $headers = ['Code', 'Name', 'Symbol', 'Exchange Rate', 'Is Base'];
        $rows = [];

        foreach ($currencies as $currency) {
            $rows[] = [
                $currency->code,
                $currency->name,
                $currency->symbol,
                $currency->exchange_rate,
                $currency->is_base ? 'Yes' : 'No',
            ];
        }

        $this->table($headers, $rows);

        // Test some conversions
        $this->info("\n=== Test Conversions ===");
        
        $testCases = [
            ['amount' => 1000, 'from' => 'XAF', 'to' => 'RUB'],
            ['amount' => 1000, 'from' => 'XAF', 'to' => 'EUR'],
            ['amount' => 100, 'from' => 'EUR', 'to' => 'RUB'],
            ['amount' => 100, 'from' => 'USD', 'to' => 'XAF'],
        ];

        foreach ($testCases as $test) {
            try {
                $result = $currencyService->convert(
                    $test['amount'],
                    $test['from'],
                    $test['to']
                );

                $this->info(sprintf(
                    "%s %s → %s %s (rate: %s)",
                    number_format($test['amount'], 2),
                    $test['from'],
                    number_format($result['converted_amount'], 2),
                    $test['to'],
                    $result['exchange_rate']
                ));
            } catch (\Exception $e) {
                $this->error(sprintf(
                    "Failed to convert %s %s to %s: %s",
                    $test['amount'],
                    $test['from'],
                    $test['to'],
                    $e->getMessage()
                ));
            }
        }

        return 0;
    }
}