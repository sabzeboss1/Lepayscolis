<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\KYCDocument;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class AdminKYCService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get paginated KYC submissions with filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getKYCSubmissions(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = KYCDocument::with('user');

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Sort by submission date
        $sortOrder = $filters['sort'] ?? 'newest';
        if ($sortOrder === 'newest') {
            $query->latest('created_at');
        } else {
            $query->oldest('created_at');
        }

        return $query->paginate($perPage);
    }

    /**
     * Get detailed KYC submission.
     *
     * @param string $kycId
     * @return KYCDocument
     */
    public function getKYCDetails(string $kycId): KYCDocument
    {
        return KYCDocument::with('user')->findOrFail($kycId);
    }

    /**
     * Approve KYC submission.
     *
     * @param string $kycId
     * @param User $admin
     * @param bool $clearCache Whether to clear dashboard cache (default true)
     * @return KYCDocument
     */
    public function approveKYC(string $kycId, User $admin, bool $clearCache = true): KYCDocument
    {
        $kyc = KYCDocument::with('user')->findOrFail($kycId);

        $before = ['status' => $kyc->status];

        $kyc->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        // Update user KYC status
        $kyc->user->update(['kyc_status' => 'approved']);

        $after = ['status' => 'approved'];

        // Create audit log
        AuditLog::log($admin, 'approve', 'kyc', $kycId, $before, $after);

        // Clear admin dashboard cache to update pending KYC count
        if ($clearCache) {
            $this->clearDashboardCache();
        }

        // TODO: Queue notification
        // $this->notificationService->sendKYCApprovedNotification($kyc->user);

        return $kyc->fresh(['user']);
    }

    /**
     * Reject KYC submission.
     *
     * @param string $kycId
     * @param string $reason
     * @param User $admin
     * @param bool $clearCache Whether to clear dashboard cache (default true)
     * @return KYCDocument
     */
    public function rejectKYC(string $kycId, string $reason, User $admin, bool $clearCache = true): KYCDocument
    {
        $kyc = KYCDocument::with('user')->findOrFail($kycId);

        $before = ['status' => $kyc->status];

        $kyc->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $after = ['status' => 'rejected', 'reason' => $reason];

        // Create audit log
        AuditLog::log($admin, 'reject', 'kyc', $kycId, $before, $after);

        // Clear admin dashboard cache to update pending KYC count
        if ($clearCache) {
            $this->clearDashboardCache();
        }

        // TODO: Queue notification
        // $this->notificationService->sendKYCRejectedNotification($kyc->user, $reason);

        return $kyc->fresh(['user']);
    }

    /**
     * Bulk approve KYC submissions.
     *
     * @param array $kycIds
     * @param User $admin
     * @return array
     */
    public function bulkApproveKYC(array $kycIds, User $admin): array
    {
        $approved = [];
        $failed = [];

        foreach ($kycIds as $kycId) {
            try {
                // Don't clear cache for each individual approval
                $this->approveKYC($kycId, $admin, false);
                $approved[] = $kycId;
            } catch (\Exception $e) {
                $failed[] = $kycId;
            }
        }

        // Clear dashboard cache once after bulk operation
        if (count($approved) > 0) {
            $this->clearDashboardCache();
        }

        return [
            'approved' => $approved,
            'failed' => $failed,
        ];
    }

    /**
     * Bulk reject KYC submissions.
     *
     * @param array $kycIds
     * @param string $reason
     * @param User $admin
     * @return array
     */
    public function bulkRejectKYC(array $kycIds, string $reason, User $admin): array
    {
        $rejected = [];
        $failed = [];

        foreach ($kycIds as $kycId) {
            try {
                // Don't clear cache for each individual rejection
                $this->rejectKYC($kycId, $reason, $admin, false);
                $rejected[] = $kycId;
            } catch (\Exception $e) {
                $failed[] = $kycId;
            }
        }

        // Clear dashboard cache once after bulk operation
        if (count($rejected) > 0) {
            $this->clearDashboardCache();
        }

        return [
            'rejected' => $rejected,
            'failed' => $failed,
        ];
    }

    /**
     * Clear admin dashboard cache to reflect updated KYC counts
     * 
     * @return void
     */
    private function clearDashboardCache(): void
    {
        Cache::forget('admin_dashboard_metrics');
        Cache::forget('admin_dashboard_charts');
        
        // Also clear activity feed cache as it might include KYC submissions
        for ($limit = 10; $limit <= 50; $limit += 10) {
            Cache::forget("admin_activity_feed_{$limit}");
        }
    }
}
