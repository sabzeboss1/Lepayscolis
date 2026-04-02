<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currencies = [
            [
                'code' => 'RUB',
                'symbol' => '₽',
                'name' => 'Russian Ruble',
                'exchange_rate' => 1.000000,
                'is_base' => true,
                'is_active' => true,
            ],
            [
                'code' => 'XAF',
                'symbol' => 'FCFA',
                'name' => 'Central African CFA Franc',
                'exchange_rate' => 6.660000, // ~655.957 / 98.5
                'is_base' => false,
                'is_active' => true,
            ],
        ];

        foreach ($currencies as $currency) {
            Currency::updateOrCreate(
                ['code' => $currency['code']],
                $currency
            );
        }
    }
}
