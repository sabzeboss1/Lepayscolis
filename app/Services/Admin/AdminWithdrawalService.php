<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminWithdrawalService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function getWithdrawals(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = DB::table('withdrawals')
            ->join('users', 'withdrawals.user_id', '=', 'users.id')
            ->select('withdrawals.*', 'users.name as user_name', 'users.email as user_email');

        if (!empty($filters['status'])) {
            $query->where('withdrawals.status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('withdrawals.created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('withdrawals.created_at', '<=', $filters['date_to']);
        }

        return $query->latest('withdrawals.created_at')->paginate($perPage);
    }

    public function getWithdrawalDetails(int $withdrawalId): object
    {
        return DB::table('withdrawals')
            ->join('users', 'withdrawals.user_id', '=', 'users.id')
            ->select('withdrawals.*', 'users.name', 'users.email')
            ->where('withdrawals.id', $withdrawalId)
            ->firstOrFail();
    }

    public function approveWithdrawal(int $withdrawalId, User $admin): void
    {
        $withdrawal = DB::table('withdrawals')->where('id', $withdrawalId)->first();

        if ($withdrawal->status !== 'pending') {
            throw new \Exception('Only pending withdrawals can be approved.');
        }

        $before = ['status' => 'pending'];

        DB::table('withdrawals')->where('id', $withdrawalId)->update([
            'status' => 'processing',
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'updated_at' => now(),
        ]);

        $after = ['status' => 'processing'];

        AuditLog::log($admin, 'approve', 'withdrawal', $withdrawalId, $before, $after);

        $user = User::find($withdrawal->user_id);
        $this->notificationService->sendWithdrawalApprovedNotification($user, $withdrawal->amount);
    }

    public function rejectWithdrawal(int $withdrawalId, string $reason, User $admin): void
    {
        $withdrawal = DB::table('withdrawals')->where('id', $withdrawalId)->first();

        if ($withdrawal->status !== 'pending') {
            throw new \Exception('Only pending withdrawals can be rejected.');
        }

        $before = ['status' => 'pending'];

        DB::table('withdrawals')->where('id', $withdrawalId)->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'updated_at' => now(),
        ]);

        $after = ['status' => 'rejected', 'reason' => $reason];

        AuditLog::log($admin, 'reject', 'withdrawal', $withdrawalId, $before, $after);

        $user = User::find($withdrawal->user_id);
        $this->notificationService->sendWithdrawalRejectedNotification($user, $reason);
    }

    public function completeWithdrawal(int $withdrawalId, User $admin): void
    {
        $withdrawal = DB::table('withdrawals')->where('id', $withdrawalId)->first();

        if ($withdrawal->status !== 'processing') {
            throw new \Exception('Only processing withdrawals can be completed.');
        }

        $before = ['status' => 'processing'];

        DB::table('withdrawals')->where('id', $withdrawalId)->update([
            'status' => 'completed',
            'completed_at' => now(),
            'updated_at' => now(),
        ]);

        $after = ['status' => 'completed'];

        AuditLog::log($admin, 'complete', 'withdrawal', $withdrawalId, $before, $after);

        $user = User::find($withdrawal->user_id);
        $this->notificationService->sendWithdrawalCompletedNotification($user, $withdrawal->amount);
    }
}
