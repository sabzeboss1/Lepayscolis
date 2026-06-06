<?php

namespace App\Services\Admin;

use App\Models\ShipmentRequest;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminShipmentRequestService
{
    public function getShipmentRequests(array $filters, int $perPage = 50): LengthAwarePaginator
    {
        $query = ShipmentRequest::with([
            'sender:id,name,email,avatar',
            'pickupCountry',
            'pickupCity',
            'deliveryCountry',
            'deliveryCity',
        ])->withCount('bids');

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('recipient_name', 'like', "%{$search}%");
            });
        }

        // Status filter
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Verification status filter
        if (!empty($filters['verification_status'])) {
            $query->where('verification_status', $filters['verification_status']);
        }

        // Date range filter
        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }
        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function getShipmentRequestDetails(string $id): ShipmentRequest
    {
        return ShipmentRequest::with([
            'sender:id,name,email,avatar,phone,kyc_status',
            'pickupCountry',
            'pickupCity',
            'deliveryCountry',
            'deliveryCity',
            'bids.traveler:id,name,avatar,rating',
        ])->findOrFail($id);
    }

    public function getPendingShipmentRequests(int $perPage = 50): LengthAwarePaginator
    {
        return ShipmentRequest::with([
            'sender:id,name,email,avatar',
            'pickupCountry',
            'pickupCity',
            'deliveryCountry',
            'deliveryCity',
        ])
        ->where('verification_status', 'pending')
        ->withCount('bids')
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);
    }

    public function approveShipmentRequest(string $id, User $admin): ShipmentRequest
    {
        $shipmentRequest = ShipmentRequest::findOrFail($id);

        if ($shipmentRequest->verification_status === 'verified') {
            throw new \Exception('This shipment request is already verified');
        }

        DB::beginTransaction();
        try {
            $shipmentRequest->update([
                'verification_status' => 'verified',
            ]);

            // Log the approval
            AuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'approve_shipment_request',
                'resource_type' => 'shipment_request',
                'resource_id' => $shipmentRequest->id,
                'ip_address' => request()->ip(),
                'before' => [
                    'verification_status' => 'pending',
                ],
                'after' => [
                    'verification_status' => 'verified',
                    'approved_by' => $admin->name,
                    'approved_at' => now()->toDateTimeString(),
                ],
            ]);

            DB::commit();
            return $shipmentRequest->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function rejectShipmentRequest(string $id, string $reason, User $admin): ShipmentRequest
    {
        $shipmentRequest = ShipmentRequest::findOrFail($id);

        DB::beginTransaction();
        try {
            $oldVerificationStatus = $shipmentRequest->verification_status;
            
            $shipmentRequest->update([
                'verification_status' => 'rejected',
                'rejection_reason' => $reason,
            ]);

            // Log the rejection
            AuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'reject_shipment_request',
                'resource_type' => 'shipment_request',
                'resource_id' => $shipmentRequest->id,
                'ip_address' => request()->ip(),
                'before' => [
                    'verification_status' => $oldVerificationStatus,
                ],
                'after' => [
                    'verification_status' => 'rejected',
                    'reason' => $reason,
                    'rejected_by' => $admin->name,
                ],
            ]);

            // TODO: Send notification to sender

            DB::commit();
            return $shipmentRequest->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function deleteShipmentRequest(string $id, string $reason, User $admin): bool
    {
        $shipmentRequest = ShipmentRequest::findOrFail($id);

        DB::beginTransaction();
        try {
            // Log the deletion
            AuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'delete_shipment_request',
                'resource_type' => 'shipment_request',
                'resource_id' => $shipmentRequest->id,
                'ip_address' => request()->ip(),
                'before' => [
                    'title' => $shipmentRequest->title,
                    'status' => $shipmentRequest->status,
                ],
                'after' => [
                    'reason' => $reason,
                    'deleted_by' => $admin->name,
                ],
            ]);

            $shipmentRequest->delete();

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getShipmentRequestAnalytics(): array
    {
        return [
            'total' => ShipmentRequest::count(),
            'pending_verification' => ShipmentRequest::where('verification_status', 'pending')->count(),
            'verified' => ShipmentRequest::where('verification_status', 'verified')->count(),
            'rejected' => ShipmentRequest::where('verification_status', 'rejected')->count(),
            'open' => ShipmentRequest::where('status', 'open')->count(),
            'assigned' => ShipmentRequest::where('status', 'assigned')->count(),
            'completed' => ShipmentRequest::where('status', 'completed')->count(),
            'cancelled' => ShipmentRequest::where('status', 'cancelled')->count(),
            'with_bids' => ShipmentRequest::has('bids')->count(),
            'without_bids' => ShipmentRequest::doesntHave('bids')->where('status', 'open')->count(),
        ];
    }

    public function bulkDeleteShipmentRequests(array $ids, ?string $reason, User $admin): int
    {
        $count = 0;
        DB::beginTransaction();
        try {
            $shipmentRequests = ShipmentRequest::whereIn('id', $ids)->get();
            foreach ($shipmentRequests as $shipmentRequest) {
                AuditLog::create([
                    'admin_id' => $admin->id,
                    'action' => 'bulk_delete_shipment_request',
                    'resource_type' => 'shipment_request',
                    'resource_id' => $shipmentRequest->id,
                    'ip_address' => request()->ip(),
                    'before' => ['title' => $shipmentRequest->title, 'status' => $shipmentRequest->status],
                    'after' => ['reason' => $reason, 'deleted_by' => $admin->name],
                ]);
                $shipmentRequest->delete();
                $count++;
            }
            DB::commit();
            return $count;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
