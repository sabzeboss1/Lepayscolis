<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Shipment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $shipment = Shipment::factory()->accepted()->create();
        $baseAmount = fake()->randomFloat(2, 10, 1000);
        $senderFee = round($baseAmount * 0.05, 2);
        $travelerFee = round($baseAmount * 0.10, 2);

        return [
            'shipment_id' => $shipment->id,
            'payer_id' => $shipment->sender_id,
            'payee_id' => $shipment->traveler_id,
            'base_amount' => $baseAmount,
            'amount' => $baseAmount + $senderFee,
            'sender_fee' => $senderFee,
            'traveler_fee' => $travelerFee,
            'platform_fee' => $senderFee + $travelerFee,
            'traveler_amount' => $baseAmount - $travelerFee,
            'payment_method' => fake()->randomElement(['card', 'mobile_money']),
            'transaction_id' => 'pi_' . fake()->unique()->uuid(),
            'status' => 'pending',
            'escrowed_at' => null,
            'released_at' => null,
        ];
    }

    /**
     * Indicate that the payment is processing.
     */
    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
        ]);
    }

    /**
     * Indicate that the payment is escrowed.
     */
    public function escrowed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'escrowed',
            'escrowed_at' => now(),
        ]);
    }

    /**
     * Indicate that the payment has been released.
     */
    public function released(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'released',
            'escrowed_at' => now()->subDays(7),
            'released_at' => now(),
        ]);
    }

    /**
     * Indicate that the payment has been refunded.
     */
    public function refunded(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'refunded',
        ]);
    }

    /**
     * Indicate that the payment has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
        ]);
    }
}
