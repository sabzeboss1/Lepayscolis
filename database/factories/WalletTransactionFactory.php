<?php

namespace Database\Factories;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class WalletTransactionFactory extends Factory
{
    protected $model = WalletTransaction::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 10, 500);
        $balance = $this->faker->randomFloat(2, 0, 1000);
        
        return [
            'id' => (string) Str::uuid(),
            'wallet_id' => Wallet::factory(),
            'type' => $this->faker->randomElement(['credit', 'debit', 'refund', 'adjustment']),
            'amount' => $amount,
            'description' => $this->faker->sentence(),
            'reference_type' => $this->faker->randomElement(['shipment', 'withdrawal', 'admin', null]),
            'reference_id' => $this->faker->optional()->uuid(),
            'balance_after' => $balance,
            'created_at' => now(),
        ];
    }
}
