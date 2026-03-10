<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class WithdrawalRequestFactory extends Factory
{
    protected $model = WithdrawalRequest::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 10, 500);
        $fee = $amount * 0.02; // 2% fee
        
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'amount' => $amount,
            'fee' => $fee,
            'net_amount' => $amount - $fee,
            'status' => 'pending',
            'rejection_reason' => null,
            'approved_by' => null,
            'approved_at' => null,
            'completed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_by' => User::factory(),
            'approved_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejection_reason' => $this->faker->sentence(),
            'approved_by' => User::factory(),
            'approved_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'approved_by' => User::factory(),
            'approved_at' => now()->subHours(2),
            'completed_at' => now(),
        ]);
    }
}
