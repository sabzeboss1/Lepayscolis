<?php

namespace App\Listeners;

use App\Events\WalletCredited;
use App\Mail\WalletCredited as WalletCreditedMail;
use App\Models\PlatformSetting;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendWalletCreditNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(WalletCredited $event): void
    {
        try {
            $user = $event->wallet->user;
            $transaction = $event->transaction;
            $newBalance = $event->wallet->balance;

            // Send email notification
            $currency = $event->wallet->currency_code ?? PlatformSetting::getDefaultCurrency();

            Mail::to($user->email)->send(
                new WalletCreditedMail($user, [
                    'amount' => $transaction->amount,
                    'new_balance' => $newBalance,
                    'description' => $transaction->description,
                    'currency' => $currency,
                ])
            );

            // Create in-app notification
            $this->notificationService->createNotification(
                $user,
                'wallet_credited',
                __('notifications.wallet_credited.title', [], $user->locale ?? 'fr'),
                __('notifications.wallet_credited.body', [
                    'amount' => number_format($transaction->amount, 2),
                    'currency' => $currency,
                    'balance' => number_format($newBalance, 2),
                ], $user->locale ?? 'fr'),
                [
                    'transaction_id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'new_balance' => $newBalance,
                    'currency' => $currency,
                ]
            );

            // Send push notification if user has FCM token
            $this->notificationService->sendPush(
                $user,
                __('notifications.wallet_credited.title', [], $user->locale ?? 'fr'),
                __('notifications.wallet_credited.body', [
                    'amount' => number_format($transaction->amount, 2),
                    'currency' => $currency,
                    'balance' => number_format($newBalance, 2),
                ], $user->locale ?? 'fr'),
                [
                    'type' => 'wallet_credited',
                    'transaction_id' => $transaction->id,
                ]
            );

            Log::info('Wallet credit notification sent', [
                'user_id' => $user->id,
                'transaction_id' => $transaction->id,
                'amount' => $transaction->amount,
                'new_balance' => $newBalance,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send wallet credit notification', [
                'user_id' => $event->wallet->user_id,
                'transaction_id' => $event->transaction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Don't throw exception - notification failure should not block wallet operation
            // The notification will be retried by the queue system
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(WalletCredited $event, \Throwable $exception): void
    {
        Log::error('Wallet credit notification failed permanently', [
            'user_id' => $event->wallet->user_id,
            'transaction_id' => $event->transaction->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
