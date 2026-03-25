<?php

namespace App\Services\Admin;

use App\Http\Resources\Admin\AdminShipmentResource;
use App\Models\AuditLog;
use App\Models\Shipment;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminShipmentService
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function getShipments(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = Shipment::with(['sender', 'traveler', 'trip', 'pickupCountry', 'pickupCity', 'deliveryCountry', 'deliveryCity']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('package_description', 'like', "%{$search}%")
                    ->orWhere('pickup_city', 'like', "%{$search}%")
                    ->orWhere('delivery_city', 'like', "%{$search}%")
                    ->orWhereHas('sender', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest('created_at')->paginate($perPage);
    }

    public function getShipmentDetails(string $shipmentId): array
    {
        $shipment = Shipment::with([
            'sender', 'traveler', 'trip.traveler',
            'payment', 'pickupCountry', 'pickupCity',
            'deliveryCountry', 'deliveryCity',
        ])->findOrFail($shipmentId);

        return [
            'shipment'       => new AdminShipmentResource($shipment),
            'status_history' => $this->getStatusHistory($shipment),
            'analytics'      => $this->getSingleShipmentAnalytics($shipment),
        ];
    }

    public function resolveDispute(string $shipmentId, string $resolutionNotes, ?float $refundAmount, User $admin): Shipment
    {
        $shipment = Shipment::findOrFail($shipmentId);

        $before = ['status' => $shipment->status];

        if ($refundAmount && $shipment->payment) {
            $this->paymentService->refundPayment($shipment->payment->id, $resolutionNotes, $refundAmount);
        }

        $after = ['refund_amount' => $refundAmount, 'resolution_notes' => $resolutionNotes];

        AuditLog::log($admin, 'resolve_dispute', 'shipment', $shipmentId, $before, $after);

        return $shipment->fresh();
    }

    public function cancelShipment(string $shipmentId, string $reason, User $admin): Shipment
    {
        $shipment = Shipment::with('payment')->findOrFail($shipmentId);

        $before = ['status' => $shipment->status];

        $shipment->update(['status' => 'cancelled']);

        if ($shipment->payment) {
            $this->paymentService->refundPayment($shipment->payment->id, 'Cancelled by admin: ' . $reason);
        }

        $after = ['status' => 'cancelled', 'reason' => $reason];

        AuditLog::log($admin, 'cancel', 'shipment', $shipmentId, $before, $after);

        return $shipment->fresh();
    }

    public function getShipmentAnalytics(): array
    {
        return Cache::remember('admin_shipment_analytics', 3600, function () {
            $total = Shipment::count();
            $delivered = Shipment::where('status', 'delivered')->count();
            $successRate = $total > 0 ? ($delivered / $total) * 100 : 0;

            return [
                'total_shipments' => $total,
                'delivered_shipments' => $delivered,
                'delivery_success_rate' => round($successRate, 2),
                'average_delivery_time' => $this->calculateAverageDeliveryTime(),
            ];
        });
    }

    protected function getSingleShipmentAnalytics(Shipment $shipment): ?array
    {
        if ($shipment->status !== 'delivered') {
            return null;
        }

        $days = round(
            ($shipment->updated_at->timestamp - $shipment->created_at->timestamp) / 86400,
            1
        );

        return [
            'delivery_time_days' => $days,
            'on_time_delivery'   => $days <= 7,
        ];
    }

    protected function getStatusHistory(Shipment $shipment): array
    {
        $history = [
            ['status' => 'pending', 'timestamp' => $shipment->created_at->toIso8601String()],
        ];

        if ($shipment->status !== 'pending') {
            $history[] = ['status' => $shipment->status, 'timestamp' => $shipment->updated_at->toIso8601String()];
        }

        return $history;
    }

    protected function calculateAverageDeliveryTime(): float
    {
        // Compatible with both SQLite and MySQL
        $avg = Shipment::where('status', 'delivered')
            ->selectRaw('AVG(CAST((julianday(updated_at) - julianday(created_at)) AS REAL)) as avg_days')
            ->value('avg_days');

        return round($avg ?? 0, 1);
    }
}
