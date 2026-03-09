<?php

namespace Tests\Unit\Listeners;

use App\Events\WalletCredited;
use App\Listeners\SendWalletCreditNotification;
use App\Mail\WalletCredited as WalletCreditedMail;
use App\Models\Notification;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendWalletCreditNotificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test listener sends email notification.
     */
    public function test_listener_sends_email_notification(): void
    {
        // Arrange
        Mail::fake();
        
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'locale' => 'fr',
        ]);
        $wallet = $user->wallet;
        $wallet->balance = 100.00;
        $wallet->save();
        
        $transaction = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'description' => 'Payment for shipment #123',
            'balance_after' => 100.00,
        ]);
        
        $event = new WalletCredited($wallet, $transaction);
        $listener = new SendWalletCreditNotification(app(NotificationService::class));

        // Act
        $listener->handle($event);

        // Assert
        Mail::assertSent(WalletCreditedMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    /**
     * Test listener creates in-app notification.
     */
    public function test_listener_creates_in_app_notification(): void
    {
        // Arrange
        Mail::fake();
        
        $user = User::factory()->create([
            'locale' => 'fr',
        ]);
        $wallet = $user->wallet;
        $wallet->balance = 100.00;
        $wallet->save();
        
        $transaction = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'description' => 'Payment for shipment #123',
            'balance_after' => 100.00,
        ]);
        
        $event = new WalletCredited($wallet, $transaction);
        $listener = new SendWalletCreditNotification(app(NotificationService::class));

        // Act
        $listener->handle($event);

        // Assert
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
        $this->assertEquals(100.00, $notification->data['new_balance']);
    }

    /**
     * Test listener handles errors gracefully.
     */
    public function test_listener_handles_errors_gracefully(): void
    {
        // Arrange
        Mail::fake();
        
        $user = User::factory()->create();
        $wallet = $user->wallet;
        $wallet->balance = 100.00;
        $wallet->save();
        
        $transaction = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'balance_after' => 100.00,
        ]);
        
        $event = new WalletCredited($wallet, $transaction);
        
        // Mock NotificationService to throw exception
        $mockService = $this->createMock(NotificationService::class);
        $mockService->method('createNotification')
            ->willThrowException(new \Exception('Database error'));
        
        $listener = new SendWalletCreditNotification($mockService);

        // Act & Assert - should not throw exception
        $listener->handle($event);
        
        // Email should still be sent even if in-app notification fails
        Mail::assertSent(WalletCreditedMail::class);
    }

    /**
     * Test listener respects user locale.
     */
    public function test_listener_respects_user_locale(): void
    {
        // Arrange
        Mail::fake();
        
        $user = User::factory()->create([
            'locale' => 'en',
        ]);
        $wallet = $user->wallet;
        $wallet->balance = 100.00;
        $wallet->save();
        
        $transaction = WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50.00,
            'balance_after' => 100.00,
        ]);
        
        $event = new WalletCredited($wallet, $transaction);
        $listener = new SendWalletCreditNotification(app(NotificationService::class));

        // Act
        $listener->handle($event);

        // Assert
        $notification = Notification::where('user_id', $user->id)
            ->where('type', 'wallet_credited')
            ->first();
        
        $this->assertNotNull($notification);
        $this->assertStringContainsString('Wallet Credited', $notification->title);
    }
}
