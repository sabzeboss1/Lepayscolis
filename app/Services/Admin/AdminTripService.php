<?php

namespace App\Services\Admin;

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
        $query = Trip::with('traveler');

        // Search by origin, destination, or traveler name
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('origin', 'like', "%{$search}%")
                    ->orWhere('destination', 'like', "%{$search}%")
                    ->orWhereHas('traveler', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Sort
        $sort = $filters['sort'] ?? 'departure_date';
        if ($sort === 'departure_date') {
            $query->orderBy('departure_date', 'desc');
        } else {
            $query->latest('created_at');
        }

        return $query->paginate($perPage);
    }

    /**
     * Get detailed trip information.
     *
     * @param int $tripId
     * @return array
     */
    public function getTripDetails(int $tripId): array
    {
        $trip = Trip::with(['traveler', 'shipments.sender'])->findOrFail($tripId);

        return [
            'trip' => $trip,
            'shipments' => $trip->shipments,
            'timeline' => $this->buildTripTimeline($trip),
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
    public function updateTrip(int $tripId, array $data, User $admin): Trip
    {
        $trip = Trip::findOrFail($tripId);

        $before = $trip->only(['departure_date', 'available_space', 'price_per_kg']);

        $trip->update($data);

        $after = $trip->only(['departure_date', 'available_space', 'price_per_kg']);

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
    public function cancelTrip(int $tripId, string $reason, User $admin): Trip
    {
        $trip = Trip::with('shipments')->findOrFail($tripId);

        DB::transaction(function () use ($trip, $reason, $admin) {
            $before = ['status' => $trip->status];

            // Cancel trip
            $trip->update(['status' => 'cancelled']);

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
            $popularRoutes = Trip::select('origin', 'destination', DB::raw('count(*) as count'))
                ->groupBy('origin', 'destination')
                ->orderBy('count', 'desc')
                ->take(10)
                ->get();

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

        if ($trip->status === 'completed') {
            $timeline[] = ['event' => 'Trip completed', 'date' => $trip->updated_at];
        } elseif ($trip->status === 'cancelled') {
            $timeline[] = ['event' => 'Trip cancelled', 'date' => $trip->updated_at];
        }

        return $timeline;
    }
}
