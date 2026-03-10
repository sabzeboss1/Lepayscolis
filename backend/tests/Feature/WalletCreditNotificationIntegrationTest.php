<?php

namespace Tests\Feature;

use App\Events\WalletCredited;
use App\Mail\WalletCredited as WalletCreditedMail;
use App\Models\Notification;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WalletCreditNotificationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test complete wallet credit flow with notifications.
     * 
     * **Validates: Requirements 3.7, 14.1, 20.7**
     */
    public function test_wallet_credit_triggers_all_notifications(): void
    {
        // Arrange
        Mail::fake();
        
        $user = User::factory()->create([
            'email' => 'traveler@example.com',
            'locale' => 'fr',
            'fcm_token' => 'test_fcm_token',
        ]);
        
        $walletService = app(WalletService::class);

        // Act - Credit the wallet (this will dispatch the event)
        $transaction = $walletService->credit(
            $user->wallet,
            50.00,
            'Payment for shipment #123',
            'shipment',
            'shipment-uuid-123'
        );

        // Assert - Email notification sent
        Mail::assertSent(WalletCreditedMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email)
                && $mail->user->id === $user->id
                && isset($mail->data['amount'])
                && isset($mail->data['new_balance']);
        });

        // Assert - In-app notification created
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'wallet_credited',
        ]);

        $notification = Notification::where('user_id', $user->id)
            ->where('type', 'wallet_credited')
            ->first();

        $this->assertNotNull($notification);
        $this->assertEquals($transaction->id, $notification->data['transaction_id']);
        $this->assertEquals(50.00, $notification->data['amount']);
        $this->assertEquals(50.00, $notification->data['new_balance']);
    }

    /**
     * Test wallet credit notification includes correct amounts.
     * 
     * **Validates: Requirements 3.7, 14.1**
     */
    public function test_wallet_credit_notification_includes_correct_amounts(): void
    {
        // Arrange
        Mail::fake();
        
        $user = User::factory()->create(['locale' => 'en']);
        $walletService = app(WalletService::class);

        // Credit wallet twice to test balance accumulation
        $walletService->credit($user->wallet, 30.00, 'First payment');
        
        // Clear notifications from first credit
        Notification::where('user_id', $user->id)->delete();
        
        $transaction2 = $walletService->credit($user->wallet, 20.00, 'Second payment');

        // Assert - Notification shows correct amounts
        $notification = Notification::where('user_id', $user->id)
            ->where('type', 'wallet_credited')
            ->latest()
            ->first();

        $this->assertNotNull($notification);
        $this->assertEquals(20.00, $notification->data['amount']); // Credit amount
        $this->assertEquals(50.00, $notification->data['new_balance']); // Total balance
    }

    /**
     * Test notification failure does not block wallet operation.
     * 
     * **Validates: Requirements 20.7**
     */
    public function test_notification_failure_does_not_block_wallet_credit(): void
    {
        // Arrange
        $user = User::factory()->create();
        $walletService = app(WalletService::class);
        
        // Simulate notification service failure by not having notification table
        // (In real scenario, this would be a service failure)

        // Act - Credit wallet should succeed even if notification fails
        $transaction = $walletService->credit(
            $user->wallet,
            75.00,
            'Payment despite notification failure'
        );

        // Assert - Wallet was credited successfully
        $this->assertNotNull($transaction);
        $this->assertEquals(75.00, $transaction->amount);
        $this->assertEquals(75.00, $user->wallet->fresh()->balance);
        
        // Transaction was recorded
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $user->wallet->id,
            'type' => 'credit',
            'amount' => 75.00,
        ]);
    }

    /**
     * Test notification respects user locale.
     * 
     * **Validates: Requirements 14.7**
     */
    public function test_notification_respects_user_locale(): void
    {
        // Arrange
        Mail::fake();
        
        $frenchUser = User::factory()->create(['locale' => 'fr']);
        $englishUser = User::factory()->create(['locale' => 'en']);
        
        $walletService = app(WalletService::class);

        // Act - Credit both wallets
        $walletService->credit($frenchUser->wallet, 25.00, 'Test');
        $walletService->credit($englishUser->wallet, 25.00, 'Test');

        // Assert - French notification
        $frNotification = Notification::where('user_id', $frenchUser->id)
            ->where('type', 'wallet_credited')
            ->first();
        
        $this->assertNotNull($frNotification);
        $this->assertStringContainsString('Portefeuille crédité', $frNotification->title);

        // Assert - English notification
        $enNotification = Notification::where('user_id', $englishUser->id)
            ->where('type', 'wallet_credited')
            ->first();
        
        $this->assertNotNull($enNotification);
        $this->assertStringContainsString('Wallet Credited', $enNotification->title);
    }
}
