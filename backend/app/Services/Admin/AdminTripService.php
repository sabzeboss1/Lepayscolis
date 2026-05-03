<?php

namespace App\Services\Admin;

use App\Http\Resources\Admin\AdminTripResource;
use App\Models\AuditLog;
use App\Models\Trip;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\PaymentService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminTripService
{
    protected NotificationService $notificationService;
    protected PaymentService $paymentService;

    public function __construct(
        NotificationService $notificationService,
        PaymentService $paymentService
    ) {
        $this->notificationService = $notificationService;
        $this->paymentService = $paymentService;
    }

    /**
     * Get paginated trips with filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getTrips(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = Trip::with(['traveler', 'shipments', 'departureCountry', 'departureCity', 'arrivalCountry', 'arrivalCity']);

        // Search by departure/arrival city/country or traveler name
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('departure_city', 'like', "%{$search}%")
                    ->orWhere('departure_country', 'like', "%{$search}%")
                    ->orWhere('arrival_city', 'like', "%{$search}%")
                    ->orWhere('arrival_country', 'like', "%{$search}%")
                    ->orWhereHas('traveler', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by verification status
        if (!empty($filters['verification_status'])) {
            $query->where('verification_status', $filters['verification_status']);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'newest';
        if ($sortBy === 'departure') {
            $query->orderBy('departure_date', 'desc');
        } elseif ($sortBy === 'oldest') {
            $query->oldest('created_at');
        } else {
            $query->latest('created_at');
        }

        return $query->paginate($perPage);
    }

    /**
     * Get detailed trip information.
     *
     * @param string $tripId
     * @return array
     */
    public function getTripDetails(string $tripId): array
    {
        $trip = Trip::with([
            'traveler', 'shipments.sender',
            'departureCountry', 'departureCity',
            'arrivalCountry', 'arrivalCity',
        ])->findOrFail($tripId);

        // Format shipments with available fields
        $formattedShipments = $trip->shipments->map(fn($s) => [
            'id'                => $s->id,
            'tracking_number'   => strtoupper(substr(str_replace('-', '', $s->id), 0, 10)),
            'sender_name'       => $s->sender?->name ?? 'Unknown',
            'recipient_city'    => $s->delivery_city,
            'recipient_country' => $s->delivery_country,
            'weight'            => (float) $s->package_weight,
            'status'            => $s->status,
            'price'             => (float) $s->payment_amount,
        ])->values();

        // Per-trip analytics
        $totalShipments = $trip->shipments->count();
        $totalRevenue   = (float) $trip->shipments->whereIn('payment_status', ['released'])->sum('payment_amount');
        $delivered      = $trip->shipments->where('status', 'delivered')->count();
        $completionRate = $totalShipments > 0 ? round(($delivered / $totalShipments) * 100, 1) : 0;

        $analytics = [
            'total_shipments' => $totalShipments,
            'total_revenue'   => $totalRevenue,
            'completion_rate' => $completionRate,
            'average_rating'  => null,
        ];

        return [
            'trip'      => new AdminTripResource($trip),
            'shipments' => $formattedShipments,
            'analytics' => $analytics,
            'timeline'  => $this->buildTripTimeline($trip),
        ];
    }

    /**
     * Update trip information.
     *
     * @param int $tripId
     * @param array $data
     * @param User $admin
     * @return Trip
     */
    public function updateTrip(string $tripId, array $data, User $admin): Trip
    {
        $trip = Trip::findOrFail($tripId);

        $before = $trip->only(['departure_date', 'available_capacity', 'price_per_kg']);

        $trip->update($data);

        $after = $trip->only(['departure_date', 'available_capacity', 'price_per_kg']);

        // Create audit log
        AuditLog::log($admin, 'update', 'trip', $tripId, $before, $after);

        return $trip->fresh();
    }

    /**
     * Cancel trip and process refunds.
     *
     * @param int $tripId
     * @param string $reason
     * @param User $admin
     * @return Trip
     */
    public function cancelTrip(string $tripId, string $reason, User $admin): Trip
    {
        $trip = Trip::with('shipments')->findOrFail($tripId);

        DB::transaction(function () use ($trip, $reason, $admin) {
            $before = ['status' => $trip->status];

            // Cancel trip and store reason
            $trip->update(['status' => 'cancelled', 'rejection_reason' => $reason]);

            // Cancel all associated shipments and process refunds
            foreach ($trip->shipments as $shipment) {
                if (in_array($shipment->status, ['pending', 'accepted'])) {
                    $shipment->update(['status' => 'cancelled']);

                    // Process refund
                    if ($shipment->payment) {
                        $this->paymentService->refundPayment(
                            $shipment->payment->id,
                            'Trip cancelled by admin: ' . $reason
                        );
                    }

                    // Notify sender
                    $this->notificationService->sendShipmentCancelledNotification(
                        $shipment,
                        'Trip cancelled: ' . $reason
                    );
                }
            }

            // Notify traveler
            $this->notificationService->sendTripCancelledNotification($trip, $reason);

            $after = ['status' => 'cancelled', 'reason' => $reason];

            // Create audit log
            AuditLog::log($admin, 'cancel', 'trip', $trip->id, $before, $after);
        });

        return $trip->fresh();
    }

    /**
     * Get paginated trips pending verification.
     */
    public function getPendingTrips(int $perPage = 50): LengthAwarePaginator
    {
        return Trip::with(['traveler', 'departureCountry', 'departureCity', 'arrivalCountry', 'arrivalCity'])
            ->pendingVerification()
            ->latest('created_at')
            ->paginate($perPage);
    }

    /**
     * Verify (approve) a trip.
     */
    public function verifyTrip(string $tripId, User $admin): Trip
    {
        $trip = Trip::findOrFail($tripId);

        $before = ['verification_status' => $trip->verification_status];

        $trip->update([
            'verification_status' => 'verified',
            'verified_by' => $admin->id,
            'verified_at' => now(),
            'rejection_reason' => null,
        ]);

        $after = ['verification_status' => 'verified'];

        AuditLog::log($admin, 'verify', 'trip', $trip->id, $before, $after);

        $this->notificationService->sendTripVerifiedNotification($trip);

        return $trip->fresh();
    }

    /**
     * Reject a trip with reason.
     */
    public function rejectTrip(string $tripId, string $reason, User $admin): Trip
    {
        $trip = Trip::findOrFail($tripId);

        $before = ['verification_status' => $trip->verification_status];

        $trip->update([
            'verification_status' => 'rejected',
            'rejection_reason' => $reason,
            'verified_by' => $admin->id,
            'verified_at' => now(),
        ]);

        $after = ['verification_status' => 'rejected', 'reason' => $reason];

        AuditLog::log($admin, 'reject', 'trip', $trip->id, $before, $after);

        $this->notificationService->sendTripRejectedNotification($trip, $reason);

        return $trip->fresh();
    }

    /**
     * Bulk verify trips.
     */
    public function bulkVerifyTrips(array $tripIds, User $admin): array
    {
        $verified = [];
        $failed = [];

        foreach ($tripIds as $tripId) {
            try {
                $this->verifyTrip($tripId, $admin);
                $verified[] = $tripId;
            } catch (\Exception $e) {
                $failed[] = $tripId;
            }
        }

        return [
            'verified' => $verified,
            'failed' => $failed,
        ];
    }

    /**
     * Bulk reject trips.
     */
    public function bulkRejectTrips(array $tripIds, string $reason, User $admin): array
    {
        $rejected = [];
        $failed = [];

        foreach ($tripIds as $tripId) {
            try {
                $this->rejectTrip($tripId, $reason, $admin);
                $rejected[] = $tripId;
            } catch (\Exception $e) {
                $failed[] = $tripId;
            }
        }

        return [
            'rejected' => $rejected,
            'failed' => $failed,
        ];
    }

    /**
     * Delete a trip permanently.
     *
     * @param string $tripId
     * @param User $admin
     * @return bool
     * @throws \Exception
     */
    public function deleteTrip(string $tripId, User $admin): bool
    {
        $trip = Trip::with('shipments')->findOrFail($tripId);

        // Check if trip has active shipments
        $activeShipments = $trip->shipments()
            ->whereIn('status', ['pending', 'accepted', 'in_transit'])
            ->count();

        if ($activeShipments > 0) {
            throw new \Exception("Cannot delete trip with active shipments. Please cancel the trip first.");
        }

        return DB::transaction(function () use ($trip, $admin) {
            $before = $trip->toArray();

            // Log the deletion
            AuditLog::log($admin, 'delete', 'trip', $trip->id, $before, ['deleted' => true]);

            // Delete the trip (cascade will handle related records based on migration)
            $deleted = $trip->delete();

            // Clear cache
            Cache::forget('admin_trip_analytics');

            return $deleted;
        });
    }

    /**
     * Bulk delete trips.
     *
     * @param array $tripIds
     * @param User $admin
     * @return array
     */
    public function bulkDeleteTrips(array $tripIds, User $admin): array
    {
        $deleted = [];
        $failed = [];

        foreach ($tripIds as $tripId) {
            try {
                $this->deleteTrip($tripId, $admin);
                $deleted[] = $tripId;
            } catch (\Exception $e) {
                $failed[] = ['id' => $tripId, 'error' => $e->getMessage()];
            }
        }

        return [
            'deleted' => $deleted,
            'failed' => $failed,
        ];
    }
     * Get trip analytics.
     *
     * @return array
     */
    public function getTripAnalytics(): array
    {
        return Cache::remember('admin_trip_analytics', 3600, function () {
            $totalTrips = Trip::count();
            $completedTrips = Trip::where('status', 'completed')->count();
            $completionRate = $totalTrips > 0 ? ($completedTrips / $totalTrips) * 100 : 0;

            // Popular routes
            $popularRoutes = Trip::select(
                    'departure_city', 'departure_country',
                    'arrival_city', 'arrival_country',
                    DB::raw('count(*) as count')
                )
                ->groupBy('departure_city', 'departure_country', 'arrival_city', 'arrival_country')
                ->orderBy('count', 'desc')
                ->take(10)
                ->get()
                ->map(fn($r) => [
                    'origin' => "{$r->departure_city}, {$r->departure_country}",
                    'destination' => "{$r->arrival_city}, {$r->arrival_country}",
                    'count' => $r->count,
                ]);

            return [
                'total_trips' => $totalTrips,
                'completed_trips' => $completedTrips,
                'completion_rate' => round($completionRate, 2),
                'popular_routes' => $popularRoutes,
            ];
        });
    }

    /**
     * Build trip timeline.
     *
     * @param Trip $trip
     * @return array
     */
    protected function buildTripTimeline(Trip $trip): array
    {
        $timeline = [
            ['event' => 'Trip created', 'date' => $trip->created_at],
        ];

        if ($trip->verification_status === 'verified' && $trip->verified_at) {
            $timeline[] = ['event' => 'Trip verified', 'date' => $trip->verified_at];
        } elseif ($trip->verification_status === 'rejected' && $trip->verified_at) {
            $timeline[] = ['event' => 'Trip rejected', 'date' => $trip->verified_at];
        }

        if ($trip->status === 'completed') {
            $timeline[] = ['event' => 'Trip completed', 'date' => $trip->updated_at];
        } elseif ($trip->status === 'cancelled') {
            $timeline[] = ['event' => 'Trip cancelled', 'date' => $trip->updated_at];
        }

        return $timeline;
    }
}
