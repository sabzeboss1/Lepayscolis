<?php

namespace App\Services\Admin;

use App\Models\AdminNotification;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminNotificationService
{
    /**
     * Send notification to a specific user.
     *
     * @param int $userId
     * @param string $title
     * @param string $message
     * @param User $admin
     * @return array
     */
    public function sendNotification(int $userId, string $title, string $message, User $admin): array
    {
        $user = User::findOrFail($userId);

        DB::beginTransaction();
        try {
            // Create notification
            Notification::create([
                'user_id' => $user->id,
                'type' => 'admin_message',
                'title' => $title,
                'body' => $message,
                'data' => json_encode(['sent_by_admin' => $admin->id]),
            ]);

            // Record in admin notifications
            $adminNotification = AdminNotification::create([
                'sent_by' => $admin->id,
                'recipient_type' => 'individual',
                'recipient_count' => 1,
                'title' => $title,
                'message' => $message,
            ]);

            // Create audit log
            AuditLog::log(
                $admin->id,
                'send_notification',
                'notification',
                $adminNotification->id,
                null,
                ['user_id' => $userId, 'title' => $title]
            );

            DB::commit();

            return [
                'success' => true,
                'recipient_count' => 1,
                'notification_id' => $adminNotification->id,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Send broadcast notification to all users.
     *
     * @param string $title
     * @param string $message
     * @param User $admin
     * @return array
     */
    public function sendBroadcast(string $title, string $message, User $admin): array
    {
        $users = User::where('role', 'user')->get();

        DB::beginTransaction();
        try {
            $recipientCount = 0;

            foreach ($users as $user) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'admin_broadcast',
                    'title' => $title,
                    'body' => $message,
                    'data' => json_encode(['sent_by_admin' => $admin->id]),
                ]);
                $recipientCount++;
            }

            // Record in admin notifications
            $adminNotification = AdminNotification::create([
                'sent_by' => $admin->id,
                'recipient_type' => 'broadcast',
                'recipient_count' => $recipientCount,
                'title' => $title,
                'message' => $message,
            ]);

            // Create audit log
            AuditLog::log(
                $admin->id,
                'send_broadcast',
                'notification',
                $adminNotification->id,
                null,
                ['recipient_count' => $recipientCount, 'title' => $title]
            );

            DB::commit();

            return [
                'success' => true,
                'recipient_count' => $recipientCount,
                'notification_id' => $adminNotification->id,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Send notification to a filtered group of users.
     *
     * @param string $title
     * @param string $message
     * @param array $groupFilter
     * @param User $admin
     * @return array
     */
    public function sendToGroup(string $title, string $message, array $groupFilter, User $admin): array
    {
        $query = User::where('role', 'user');

        // Apply filters
        if (isset($groupFilter['kyc_status'])) {
            $query->where('kyc_status', $groupFilter['kyc_status']);
        }
        if (isset($groupFilter['status'])) {
            if ($groupFilter['status'] === 'active') {
                $query->whereNull('deleted_at');
            } elseif ($groupFilter['status'] === 'suspended') {
                $query->whereNotNull('deleted_at');
            }
        }
        if (isset($groupFilter['last_login_days'])) {
            $query->where('last_login', '>=', now()->subDays($groupFilter['last_login_days']));
        }

        $users = $query->get();

        DB::beginTransaction();
        try {
            $recipientCount = 0;

            foreach ($users as $user) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'admin_group',
                    'title' => $title,
                    'body' => $message,
                    'data' => json_encode(['sent_by_admin' => $admin->id]),
                ]);
                $recipientCount++;
            }

            // Record in admin notifications
            $adminNotification = AdminNotification::create([
                'sent_by' => $admin->id,
                'recipient_type' => 'group',
                'recipient_count' => $recipientCount,
                'title' => $title,
                'message' => $message,
                'group_filter' => $groupFilter,
            ]);

            // Create audit log
            AuditLog::log(
                $admin->id,
                'send_group_notification',
                'notification',
                $adminNotification->id,
                null,
                ['recipient_count' => $recipientCount, 'title' => $title, 'filters' => $groupFilter]
            );

            DB::commit();

            return [
                'success' => true,
                'recipient_count' => $recipientCount,
                'notification_id' => $adminNotification->id,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get notification history.
     *
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getNotificationHistory(int $perPage = 50)
    {
        return AdminNotification::with('sentBy:id,name,email')
            ->orderBy('sent_at', 'desc')
            ->paginate($perPage);
    }
}
