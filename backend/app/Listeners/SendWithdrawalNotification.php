<?php

namespace App\Listeners;

use App\Events\WithdrawalApproved;
use App\Events\WithdrawalRejected;
use App\Events\WithdrawalCompleted;
use App\Mail\WithdrawalApproved as WithdrawalApprovedMail;
use App\Mail\WithdrawalRejected as WithdrawalRejectedMail;
use App\Mail\WithdrawalCompleted as WithdrawalCompletedMail;
use App\Models\PlatformSetting;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendWithdrawalNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Route the event to the appropriate handler method.
     */
    public function handle(object $event): void
    {
        // Refresh SMTP settings from DB (queue worker may have stale config)
        \App\Providers\MailConfigServiceProvider::applySmtpFromDatabase();
        Mail::purge('smtp');

        match (true) {
            $event instanceof WithdrawalApproved => $this->handleApproved($event),
            $event instanceof WithdrawalRejected => $this->handleRejected($event),
            $event instanceof WithdrawalCompleted => $this->handleCompleted($event),
            default => null,
        };
    }

    /**
     * Handle the WithdrawalApproved event.
     */
    public function handleApproved(WithdrawalApproved $event): void
    {
        try {
            $user = $event->withdrawal->user;
            $withdrawal = $event->withdrawal;

            // Use destination currency for display, wallet currency for debit info
            $destinationCurrency = $withdrawal->currency ?? PlatformSetting::getDefaultCurrency();
            $walletCurrency = $withdrawal->wallet_currency ?? $destinationCurrency;
            $walletAmount = $withdrawal->wallet_amount ?? $withdrawal->amount;

            Mail::to($user->email)->send(
                new WithdrawalApprovedMail($user, [
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'net_amount' => $withdrawal->net_amount,
                    'withdrawal_id' => $withdrawal->id,
                    'currency' => $destinationCurrency,
                    'wallet_amount' => $walletAmount,
                    'wallet_currency' => $walletCurrency,
                ])
            );

            // Create in-app notification
            $this->notificationService->createNotification(
                $user,
                'withdrawal_approved',
                __('notifications.withdrawal_approved.title', [], $user->locale ?? 'fr'),
                __('notifications.withdrawal_approved.body', [
                    'amount' => number_format($withdrawal->amount, 2),
                    'currency' => $destinationCurrency,
                ], $user->locale ?? 'fr'),
                [
                    'withdrawal_id' => $withdrawal->id,
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'net_amount' => $withdrawal->net_amount,
                    'currency' => $destinationCurrency,
                    'wallet_amount' => $walletAmount,
                    'wallet_currency' => $walletCurrency,
                ]
            );

            // Send push notification if user has FCM token
            $this->notificationService->sendPush(
                $user,
                __('notifications.withdrawal_approved.title', [], $user->locale ?? 'fr'),
                __('notifications.withdrawal_approved.body', [
                    'amount' => number_format($withdrawal->amount, 2),
                    'currency' => $destinationCurrency,
                ], $user->locale ?? 'fr'),
                [
                    'type' => 'withdrawal_approved',
                    'withdrawal_id' => $withdrawal->id,
                ]
            );

            Log::info('Withdrawal approved notification sent', [
                'user_id' => $user->id,
                'withdrawal_id' => $withdrawal->id,
                'amount' => $withdrawal->amount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send withdrawal approved notification', [
                'user_id' => $event->withdrawal->user_id,
                'withdrawal_id' => $event->withdrawal->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Handle the WithdrawalRejected event.
     */
    public function handleRejected(WithdrawalRejected $event): void
    {
        try {
            $user = $event->withdrawal->user;
            $withdrawal = $event->withdrawal;
            $reason = $event->reason;

            // Use destination currency for display, wallet currency for debit info
            $destinationCurrency = $withdrawal->currency ?? PlatformSetting::getDefaultCurrency();
            $walletCurrency = $withdrawal->wallet_currency ?? $destinationCurrency;
            $walletAmount = $withdrawal->wallet_amount ?? $withdrawal->amount;

            Mail::to($user->email)->send(
                new WithdrawalRejectedMail($user, [
                    'amount' => $withdrawal->amount,
                    'withdrawal_id' => $withdrawal->id,
                    'reason' => $reason,
                    'currency' => $destinationCurrency,
                    'wallet_amount' => $walletAmount,
                    'wallet_currency' => $walletCurrency,
                ])
            );

            // Create in-app notification
            $this->notificationService->createNotification(
                $user,
                'withdrawal_rejected',
                __('notifications.withdrawal_rejected.title', [], $user->locale ?? 'fr'),
                __('notifications.withdrawal_rejected.body', [
                    'amount' => number_format($withdrawal->amount, 2),
                    'currency' => $destinationCurrency,
                    'reason' => $reason,
                ], $user->locale ?? 'fr'),
                [
                    'withdrawal_id' => $withdrawal->id,
                    'amount' => $withdrawal->amount,
                    'reason' => $reason,
                    'currency' => $destinationCurrency,
                    'wallet_amount' => $walletAmount,
                    'wallet_currency' => $walletCurrency,
                ]
            );

            // Send push notification if user has FCM token
            $this->notificationService->sendPush(
                $user,
                __('notifications.withdrawal_rejected.title', [], $user->locale ?? 'fr'),
                __('notifications.withdrawal_rejected.body', [
                    'amount' => number_format($withdrawal->amount, 2),
                    'currency' => $destinationCurrency,
                    'reason' => $reason,
                ], $user->locale ?? 'fr'),
                [
                    'type' => 'withdrawal_rejected',
                    'withdrawal_id' => $withdrawal->id,
                ]
            );

            Log::info('Withdrawal rejected notification sent', [
                'user_id' => $user->id,
                'withdrawal_id' => $withdrawal->id,
                'amount' => $withdrawal->amount,
                'reason' => $reason,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send withdrawal rejected notification', [
                'user_id' => $event->withdrawal->user_id,
                'withdrawal_id' => $event->withdrawal->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Handle the WithdrawalCompleted event.
     */
    public function handleCompleted(WithdrawalCompleted $event): void
    {
        try {
            $user = $event->withdrawal->user;
            $withdrawal = $event->withdrawal;

            // Use destination currency for display, wallet currency for debit info
            $destinationCurrency = $withdrawal->currency ?? PlatformSetting::getDefaultCurrency();
            $walletCurrency = $withdrawal->wallet_currency ?? $destinationCurrency;
            $walletAmount = $withdrawal->wallet_amount ?? $withdrawal->amount;

            Mail::to($user->email)->send(
                new WithdrawalCompletedMail($user, [
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'net_amount' => $withdrawal->net_amount,
                    'withdrawal_id' => $withdrawal->id,
                    'currency' => $destinationCurrency,
                    'wallet_amount' => $walletAmount,
                    'wallet_currency' => $walletCurrency,
                ])
            );

            // Create in-app notification
            $this->notificationService->createNotification(
                $user,
                'withdrawal_completed',
                __('notifications.withdrawal_completed.title', [], $user->locale ?? 'fr'),
                __('notifications.withdrawal_completed.body', [
                    'amount' => number_format($withdrawal->amount, 2),
                    'currency' => $destinationCurrency,
                ], $user->locale ?? 'fr'),
                [
                    'withdrawal_id' => $withdrawal->id,
                    'amount' => $withdrawal->amount,
                    'fee' => $withdrawal->fee,
                    'net_amount' => $withdrawal->net_amount,
                    'currency' => $destinationCurrency,
                    'wallet_amount' => $walletAmount,
                    'wallet_currency' => $walletCurrency,
                ]
            );

            // Send push notification if user has FCM token
            $this->notificationService->sendPush(
                $user,
                __('notifications.withdrawal_completed.title', [], $user->locale ?? 'fr'),
                __('notifications.withdrawal_completed.body', [
                    'amount' => number_format($withdrawal->amount, 2),
                    'currency' => $destinationCurrency,
                ], $user->locale ?? 'fr'),
                [
                    'type' => 'withdrawal_completed',
                    'withdrawal_id' => $withdrawal->id,
                ]
            );

            Log::info('Withdrawal completed notification sent', [
                'user_id' => $user->id,
                'withdrawal_id' => $withdrawal->id,
                'amount' => $withdrawal->amount,
                'net_amount' => $withdrawal->net_amount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send withdrawal completed notification', [
                'user_id' => $event->withdrawal->user_id,
                'withdrawal_id' => $event->withdrawal->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed($event, \Throwable $exception): void
    {
        $eventType = match (true) {
            $event instanceof WithdrawalApproved => 'approved',
            $event instanceof WithdrawalRejected => 'rejected',
            $event instanceof WithdrawalCompleted => 'completed',
            default => 'unknown',
        };

        Log::error('Withdrawal notification failed permanently', [
            'event_type' => $eventType,
            'user_id' => $event->withdrawal->user_id,
            'withdrawal_id' => $event->withdrawal->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
