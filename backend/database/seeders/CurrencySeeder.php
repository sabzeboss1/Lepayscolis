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
                'code' => 'EUR',
                'symbol' => '€',
                'name' => 'Euro',
                'exchange_rate' => 1.000000,
                'is_base' => true,
                'is_active' => true,
            ],
            [
                'code' => 'USD',
                'symbol' => '$',
                'name' => 'US Dollar',
                'exchange_rate' => 1.080000,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'GBP',
                'symbol' => '£',
                'name' => 'British Pound',
                'exchange_rate' => 0.860000,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'XAF',
                'symbol' => 'FCFA',
                'name' => 'Central African CFA Franc',
                'exchange_rate' => 655.957000,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'XOF',
                'symbol' => 'FCFA',
                'name' => 'West African CFA Franc',
                'exchange_rate' => 655.957000,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'RUB',
                'symbol' => '₽',
                'name' => 'Russian Ruble',
                'exchange_rate' => 98.500000,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'CAD',
                'symbol' => 'C$',
                'name' => 'Canadian Dollar',
                'exchange_rate' => 1.470000,
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
