<?php

namespace App\Listeners;

use App\Events\WithdrawalRequested;
use App\Mail\AdminWithdrawalRequested;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotifyAdminsOfWithdrawal implements ShouldQueue
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
    public function handle(WithdrawalRequested $event): void
    {
        // Refresh SMTP settings from DB (queue worker may have stale config)
        \App\Providers\MailConfigServiceProvider::applySmtpFromDatabase();
        Mail::purge('smtp');

        try {
            $withdrawal = $event->withdrawal;
            $user = $withdrawal->user;

            // Get all admin users
            $admins = User::where('role', 'admin')->get();

            if ($admins->isEmpty()) {
                Log::warning('No admin users found to notify about withdrawal request', [
                    'withdrawal_id' => $withdrawal->id,
                    'user_id' => $user->id,
                ]);
                return;
            }

            foreach ($admins as $admin) {
                // Send email notification
                Mail::to($admin->email)->send(
                    new AdminWithdrawalRequested($admin, [
                        'withdrawal_id' => $withdrawal->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'user_id' => $user->id,
                        'amount' => $withdrawal->amount,
                        'fee' => $withdrawal->fee,
                        'net_amount' => $withdrawal->net_amount,
                        'created_at' => $withdrawal->created_at,
                        'currency' => $user->wallet->currency_code ?? PlatformSetting::getDefaultCurrency(),
                    ])
                );

                $currency = $user->wallet->currency_code ?? PlatformSetting::getDefaultCurrency();

                // Create in-app notification
                $this->notificationService->createNotification(
                    $admin,
                    'withdrawal_requested',
                    __('notifications.admin.withdrawal_requested.title', [], $admin->locale ?? 'fr'),
                    __('notifications.admin.withdrawal_requested.body', [
                        'user_name' => $user->name,
                        'amount' => number_format($withdrawal->amount, 2),
                        'currency' => $currency,
                    ], $admin->locale ?? 'fr'),
                    [
                        'withdrawal_id' => $withdrawal->id,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'amount' => $withdrawal->amount,
                        'fee' => $withdrawal->fee,
                        'net_amount' => $withdrawal->net_amount,
                        'currency' => $currency,
                    ]
                );

                // Send push notification if admin has FCM token
                $this->notificationService->sendPush(
                    $admin,
                    __('notifications.admin.withdrawal_requested.title', [], $admin->locale ?? 'fr'),
                    __('notifications.admin.withdrawal_requested.body', [
                        'user_name' => $user->name,
                        'amount' => number_format($withdrawal->amount, 2),
                        'currency' => $currency,
                    ], $admin->locale ?? 'fr'),
                    [
                        'type' => 'withdrawal_requested',
                        'withdrawal_id' => $withdrawal->id,
                        'user_id' => $user->id,
                    ]
                );
            }

            Log::info('Admin notifications sent for withdrawal request', [
                'withdrawal_id' => $withdrawal->id,
                'user_id' => $user->id,
                'admin_count' => $admins->count(),
                'amount' => $withdrawal->amount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send admin notifications for withdrawal request', [
                'withdrawal_id' => $event->withdrawal->id,
                'user_id' => $event->withdrawal->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(WithdrawalRequested $event, \Throwable $exception): void
    {
        Log::error('Admin withdrawal notification failed permanently', [
            'withdrawal_id' => $event->withdrawal->id,
            'user_id' => $event->withdrawal->user_id,
            'error' => $exception->getMessage(),
        ]);
    }
}
