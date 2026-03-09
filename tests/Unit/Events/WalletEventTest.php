<?php

namespace Tests\Unit\Events;

use App\Events\WalletBalanceAdjusted;
use App\Events\WalletCredited;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletEventTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test WalletCredited event has required properties.
     */
    public function test_wallet_credited_event_has_required_properties(): void
    {
        // Arrange
        $user = User::factory()->create();
        $wallet = $user->wallet;
        $transaction = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
        ]);

        // Act
        $event = new WalletCredited($wallet, $transaction);

        // Assert
        $this->assertInstanceOf(Wallet::class, $event->wallet);
        $this->assertInstanceOf(WalletTransaction::class, $event->transaction);
        $this->assertEquals($wallet->id, $event->wallet->id);
        $this->assertEquals($transaction->id, $event->transaction->id);
    }

    /**
     * Test WalletBalanceAdjusted event has required properties.
     */
    public function test_wallet_balance_adjusted_event_has_required_properties(): void
    {
        // Arrange
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $wallet = $user->wallet;
        $transaction = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'type' => 'adjustment',
        ]);
        $reason = 'Test adjustment reason';

        // Act
        $event = new WalletBalanceAdjusted($wallet, $transaction, $admin, $reason);

        // Assert
        $this->assertInstanceOf(Wallet::class, $event->wallet);
        $this->assertInstanceOf(WalletTransaction::class, $event->transaction);
        $this->assertInstanceOf(User::class, $event->admin);
        $this->assertIsString($event->reason);
        $this->assertEquals($wallet->id, $event->wallet->id);
        $this->assertEquals($transaction->id, $event->transaction->id);
        $this->assertEquals($admin->id, $event->admin->id);
        $this->assertEquals($reason, $event->reason);
    }
}
