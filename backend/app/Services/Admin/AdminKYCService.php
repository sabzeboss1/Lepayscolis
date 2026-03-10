<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\KYCDocument;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
     * @param int $kycId
     * @return KYCDocument
     */
    public function getKYCDetails(int $kycId): KYCDocument
    {
        return KYCDocument::with('user')->findOrFail($kycId);
    }

    /**
     * Approve KYC submission.
     *
     * @param int $kycId
     * @param User $admin
     * @return KYCDocument
     */
    public function approveKYC(int $kycId, User $admin): KYCDocument
    {
        $kyc = KYCDocument::findOrFail($kycId);

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

        // Queue notification
        $this->notificationService->sendKYCApprovedNotification($kyc->user);

        return $kyc->fresh();
    }

    /**
     * Reject KYC submission.
     *
     * @param int $kycId
     * @param string $reason
     * @param User $admin
     * @return KYCDocument
     */
    public function rejectKYC(int $kycId, string $reason, User $admin): KYCDocument
    {
        $kyc = KYCDocument::findOrFail($kycId);

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

        // Queue notification
        $this->notificationService->sendKYCRejectedNotification($kyc->user, $reason);

        return $kyc->fresh();
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
                $this->approveKYC($kycId, $admin);
                $approved[] = $kycId;
            } catch (\Exception $e) {
                $failed[] = $kycId;
            }
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
                $this->rejectKYC($kycId, $reason, $admin);
                $rejected[] = $kycId;
            } catch (\Exception $e) {
                $failed[] = $kycId;
            }
        }

        return [
            'rejected' => $rejected,
            'failed' => $failed,
        ];
    }
}
