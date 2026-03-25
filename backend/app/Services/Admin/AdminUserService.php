<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminUserService
{
    /**
     * Get paginated users with filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUsers(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = User::where('role', 'user');

        // Search by name, email, or phone
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if (!empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->whereNull('deleted_at');
            } elseif ($filters['status'] === 'suspended') {
                $query->whereNotNull('deleted_at');
            }
        }

        // Filter by KYC status
        if (!empty($filters['kyc_status'])) {
            $query->where('kyc_status', $filters['kyc_status']);
        }

        return $query->withTrashed()
            ->latest('created_at')
            ->paginate($perPage);
    }

    /**
     * Get detailed user information.
     *
     * @param int $userId
     * @return array
     */
    public function getUserDetails(int $userId): array
    {
        $user = User::withTrashed()
            ->with(['trips', 'shipmentsAsSender', 'shipmentsAsTraveler', 'kycDocuments'])
            ->findOrFail($userId);

        // Get activity history
        $activityHistory = [
            'trips_count' => $user->trips()->count(),
            'shipments_as_sender_count' => $user->shipmentsAsSender()->count(),
            'shipments_as_traveler_count' => $user->shipmentsAsTraveler()->count(),
            'ratings_received_count' => $user->ratingsReceived()->count(),
            'ratings_given_count' => $user->ratingsGiven()->count(),
        ];

        // Get recent transactions
        $transactions = DB::table('payments')
            ->where('user_id', $userId)
            ->latest('created_at')
            ->take(10)
            ->get();

        return [
            'user' => $user,
            'activity_history' => $activityHistory,
            'recent_transactions' => $transactions,
        ];
    }

    /**
     * Create a new user.
     *
     * @param array $data
     * @param User $admin
     * @return User
     */
    public function createUser(array $data, User $admin): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => bcrypt($data['password']),
            'role' => $data['role'] ?? 'user',
            'kyc_status' => 'not_submitted',
        ]);

        // Create audit log
        AuditLog::log($admin, 'create', 'user', $user->id, null, $user->only(['name', 'email', 'phone', 'role']));

        return $user;
    }

    /**
     * Update user information.
     *
     * @param int $userId
     * @param array $data
     * @param User $admin
     * @return User
     */
    public function updateUser(int $userId, array $data, User $admin): User
    {
        $user = User::findOrFail($userId);

        $before = $user->only(['name', 'email', 'phone']);

        $user->update($data);

        $after = $user->only(['name', 'email', 'phone']);

        // Create audit log
        AuditLog::log($admin, 'update', 'user', $userId, $before, $after);

        return $user->fresh();
    }

    /**
     * Suspend user account.
     *
     * @param int $userId
     * @param string $reason
     * @param User $admin
     * @return User
     */
    public function suspendUser(int $userId, string $reason, User $admin): User
    {
        $user = User::findOrFail($userId);

        $before = ['status' => 'active'];

        $user->delete(); // Soft delete

        $after = ['status' => 'suspended', 'reason' => $reason];

        // Create audit log
        AuditLog::log($admin, 'suspend', 'user', $userId, $before, $after);

        return $user->fresh();
    }

    /**
     * Activate suspended user account.
     *
     * @param int $userId
     * @param User $admin
     * @return User
     */
    public function activateUser(int $userId, User $admin): User
    {
        $user = User::withTrashed()->findOrFail($userId);

        $before = ['status' => 'suspended'];

        $user->restore();

        $after = ['status' => 'active'];

        // Create audit log
        AuditLog::log($admin, 'activate', 'user', $userId, $before, $after);

        return $user->fresh();
    }

    /**
     * Assign admin role to user (super admin only).
     *
     * @param int $userId
     * @param string $role
     * @param User $admin
     * @return User
     */
    public function assignAdminRole(int $userId, string $role, User $admin): User
    {
        $user = User::findOrFail($userId);

        $before = ['role' => $user->role];

        $user->update(['role' => $role]);

        $after = ['role' => $role];

        // Create audit log
        AuditLog::log($admin, 'assign_admin_role', 'user', $userId, $before, $after);

        return $user->fresh();
    }

    /**
     * Remove admin role from user (super admin only).
     *
     * @param int $userId
     * @param User $admin
     * @return User
     * @throws \Exception
     */
    public function removeAdminRole(int $userId, User $admin): User
    {
        // Prevent self-revocation
        if ($userId === $admin->id) {
            throw new \Exception('You cannot revoke your own admin access.');
        }

        $user = User::findOrFail($userId);

        // Ensure at least one super admin remains
        if ($user->isSuperAdmin()) {
            $superAdminCount = User::where('role', 'super_admin')->count();
            if ($superAdminCount <= 1) {
                throw new \Exception('Cannot remove the last super admin.');
            }
        }

        $before = ['role' => $user->role];

        $user->update(['role' => 'user']);

        $after = ['role' => 'user'];

        // Create audit log
        AuditLog::log($admin, 'remove_admin_role', 'user', $userId, $before, $after);

        return $user->fresh();
    }

    /**
     * Bulk suspend users.
     *
     * @param array $userIds
     * @param User $admin
     * @return int Number of users suspended
     */
    public function bulkSuspend(array $userIds, User $admin): int
    {
        $count = 0;
        $users = User::whereIn('id', $userIds)->where('role', 'user')->get();

        foreach ($users as $user) {
            if (!$user->trashed()) {
                $user->delete();
                AuditLog::log($admin, 'suspend', 'user', $user->id, ['status' => 'active'], ['status' => 'suspended', 'reason' => 'Bulk action']);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Bulk activate users.
     *
     * @param array $userIds
     * @param User $admin
     * @return int Number of users activated
     */
    public function bulkActivate(array $userIds, User $admin): int
    {
        $count = 0;
        $users = User::withTrashed()->whereIn('id', $userIds)->where('role', 'user')->get();

        foreach ($users as $user) {
            if ($user->trashed()) {
                $user->restore();
                AuditLog::log($admin, 'activate', 'user', $user->id, ['status' => 'suspended'], ['status' => 'active']);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Delete user and anonymize data.
     *
     * @param int $userId
     * @param User $admin
     * @return void
     */
    public function deleteUser(int $userId, User $admin): void
    {
        $user = User::findOrFail($userId);

        $before = $user->only(['name', 'email', 'phone']);

        // Anonymize personal data
        $user->update([
            'name' => 'Deleted User',
            'email' => 'deleted_' . $userId . '@deleted.com',
            'phone' => null,
            'avatar' => null,
        ]);

        // Soft delete
        $user->delete();

        $after = ['status' => 'deleted', 'anonymized' => true];

        // Create audit log
        AuditLog::log($admin, 'delete', 'user', $userId, $before, $after);
    }
}
