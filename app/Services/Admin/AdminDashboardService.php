<?php

namespace App\Services\Admin;

use App\Models\KYCDocument;
use App\Models\Payment;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    /**
     * Cache TTL for metrics (5 minutes)
     */
    const METRICS_CACHE_TTL = 300;

    /**
     * Cache TTL for activity feed (1 minute)
     */
    const ACTIVITY_CACHE_TTL = 60;

    /**
     * Get dashboard metrics with caching.
     *
     * @return array
     */
    public function getMetrics(): array
    {
        return Cache::remember('admin_dashboard_metrics', self::METRICS_CACHE_TTL, function () {
            return [
                'total_users' => User::count(),
                'active_trips' => Trip::whereIn('status', ['upcoming', 'in_progress'])->count(),
                'pending_shipments' => Shipment::where('status', 'pending')->count(),
                'revenue_30_days' => $this->getRevenue30Days(),
                'pending_kyc' => KYCDocument::where('status', 'pending')->count(),
                'pending_withdrawals' => DB::table('withdrawal_requests')
                    ->where('status', 'pending')
                    ->count(),
                'alerts' => $this->generateAlerts(),
            ];
        });
    }

    /**
     * Get activity feed with caching.
     *
     * @param int $limit
     * @return array
     */
    public function getActivityFeed(int $limit = 20): array
    {
        return Cache::remember("admin_activity_feed_{$limit}", self::ACTIVITY_CACHE_TTL, function () use ($limit) {
            $activities = [];

            // Recent user registrations
            $recentUsers = User::latest('created_at')
                ->take(5)
                ->get(['id', 'name', 'email', 'created_at']);

            foreach ($recentUsers as $user) {
                $activities[] = [
                    'type' => 'user_registered',
                    'description' => "New user registered: {$user->name}",
                    'timestamp' => $user->created_at,
                    'user' => [
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ],
                    'link' => "/admin/users/{$user->id}",
                ];
            }

            // Recent trip creations
            $recentTrips = Trip::with('traveler')
                ->latest('created_at')
                ->take(5)
                ->get();

            foreach ($recentTrips as $trip) {
                $activities[] = [
                    'type' => 'trip_created',
                    'description' => "New trip: {$trip->origin} → {$trip->destination}",
                    'timestamp' => $trip->created_at,
                    'user' => [
                        'name' => $trip->traveler->name,
                        'avatar' => $trip->traveler->avatar,
                    ],
                    'link' => "/admin/trips/{$trip->id}",
                ];
            }

            // Recent shipment bookings
            $recentShipments = Shipment::with('sender')
                ->latest('created_at')
                ->take(5)
                ->get();

            foreach ($recentShipments as $shipment) {
                $activities[] = [
                    'type' => 'shipment_created',
                    'description' => "New shipment: {$shipment->origin} → {$shipment->destination}",
                    'timestamp' => $shipment->created_at,
                    'user' => [
                        'name' => $shipment->sender->name,
                        'avatar' => $shipment->sender->avatar,
                    ],
                    'link' => "/admin/shipments/{$shipment->id}",
                ];
            }

            // Recent payments
            $recentPayments = Payment::with('user')
                ->where('status', 'completed')
                ->latest('created_at')
                ->take(5)
                ->get();

            foreach ($recentPayments as $payment) {
                $activities[] = [
                    'type' => 'payment_completed',
                    'description' => "Payment completed: €{$payment->amount}",
                    'timestamp' => $payment->created_at,
                    'user' => [
                        'name' => $payment->user->name,
                        'avatar' => $payment->user->avatar,
                    ],
                    'link' => "/admin/payments/{$payment->id}",
                ];
            }

            // Sort by timestamp descending and limit
            usort($activities, function ($a, $b) {
                return $b['timestamp'] <=> $a['timestamp'];
            });

            return array_slice($activities, 0, $limit);
        });
    }

    /**
     * Calculate revenue for the last 30 days.
     *
     * @return float
     */
    protected function getRevenue30Days(): float
    {
        return Payment::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('amount');
    }

    /**
     * Generate alerts for items requiring attention.
     *
     * @return array
     */
    protected function generateAlerts(): array
    {
        $alerts = [];

        // Pending KYC submissions
        $pendingKyc = KYCDocument::where('status', 'pending')->count();
        if ($pendingKyc > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$pendingKyc} KYC submission" . ($pendingKyc > 1 ? 's' : '') . " pending review",
                'link' => '/admin/kyc',
            ];
        }

        // Pending withdrawals
        $pendingWithdrawals = DB::table('withdrawal_requests')
            ->where('status', 'pending')
            ->count();
        if ($pendingWithdrawals > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$pendingWithdrawals} withdrawal request" . ($pendingWithdrawals > 1 ? 's' : '') . " pending approval",
                'link' => '/admin/withdrawals',
            ];
        }

        // Old pending shipments (>7 days)
        $oldShipments = Shipment::where('status', 'pending')
            ->where('created_at', '<', now()->subDays(7))
            ->count();
        if ($oldShipments > 0) {
            $alerts[] = [
                'type' => 'info',
                'message' => "{$oldShipments} shipment" . ($oldShipments > 1 ? 's' : '') . " pending for more than 7 days",
                'link' => '/admin/shipments?status=pending',
            ];
        }

        return $alerts;
    }
}
