<?php

namespace App\Listeners;

use App\Events\WalletBalanceAdjusted;
use App\Mail\WalletBalanceAdjusted as WalletBalanceAdjustedMail;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendBalanceAdjustmentNotification implements ShouldQueue
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
    public function handle(WalletBalanceAdjusted $event): void
    {
        try {
            $user = $event->wallet->user;
            $transaction = $event->transaction;
            $admin = $event->admin;
            $reason = $event->reason;
            $newBalance = $event->wallet->balance;
            $adjustmentAmount = $transaction->amount;
            $isPositive = $transaction->type === 'adjustment' && $adjustmentAmount > 0;

            // Send email notification
            Mail::to($user->email)->send(
                new WalletBalanceAdjustedMail($user, [
                    'amount' => $adjustmentAmount,
                    'is_positive' => $isPositive,
                    'new_balance' => $newBalance,
                    'reason' => $reason,
                    'admin_name' => $admin->name,
                ])
            );

            // Create in-app notification
            $this->notificationService->createNotification(
                $user,
                'wallet_balance_adjusted',
                __('notifications.wallet_balance_adjusted.title', [], $user->locale ?? 'fr'),
                __('notifications.wallet_balance_adjusted.body', [
                    'amount' => number_format($adjustmentAmount, 2),
                    'type' => $isPositive ? 'ajouté' : 'déduit',
                    'balance' => number_format($newBalance, 2),
                ], $user->locale ?? 'fr'),
                [
                    'transaction_id' => $transaction->id,
                    'amount' => $adjustmentAmount,
                    'is_positive' => $isPositive,
                    'new_balance' => $newBalance,
                    'reason' => $reason,
                    'admin_id' => $admin->id,
                    'admin_name' => $admin->name,
                ]
            );

            // Send push notification if user has FCM token
            $this->notificationService->sendPush(
                $user,
                __('notifications.wallet_balance_adjusted.title', [], $user->locale ?? 'fr'),
                __('notifications.wallet_balance_adjusted.body', [
                    'amount' => number_format($adjustmentAmount, 2),
                    'type' => $isPositive ? 'ajouté' : 'déduit',
                    'balance' => number_format($newBalance, 2),
                ], $user->locale ?? 'fr'),
                [
                    'type' => 'wallet_balance_adjusted',
                    'transaction_id' => $transaction->id,
                ]
            );

            Log::info('Balance adjustment notification sent', [
                'user_id' => $user->id,
                'transaction_id' => $transaction->id,
                'amount' => $adjustmentAmount,
                'is_positive' => $isPositive,
                'new_balance' => $newBalance,
                'admin_id' => $admin->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send balance adjustment notification', [
                'user_id' => $event->wallet->user_id,
                'transaction_id' => $event->transaction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Don't throw exception - notification failure should not block wallet operation
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(WalletBalanceAdjusted $event, \Throwable $exception): void
    {
        Log::error('Balance adjustment notification failed permanently', [
            'user_id' => $event->wallet->user_id,
            'transaction_id' => $event->transaction->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
