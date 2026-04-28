<?php

namespace App\Services\Admin;

use App\Models\Currency;
use App\Models\KYCDocument;
use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use App\Services\CurrencyService;
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
                'total_users' => User::where('role', 'user')->count(),
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
                    'id' => "user_registered-{$user->id}",
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
                    'id' => "trip_created-{$trip->id}",
                    'type' => 'trip_created',
                    'description' => "New trip: {$trip->departure_city} → {$trip->arrival_city}",
                    'timestamp' => $trip->created_at,
                    'user' => [
                        'name' => $trip->traveler?->name ?? 'Deleted User',
                        'avatar' => $trip->traveler?->avatar,
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
                    'id' => "shipment_created-{$shipment->id}",
                    'type' => 'shipment_created',
                    'description' => "New shipment: {$shipment->pickup_city} → {$shipment->delivery_city}",
                    'timestamp' => $shipment->created_at,
                    'user' => [
                        'name' => $shipment->sender?->name ?? 'Deleted User',
                        'avatar' => $shipment->sender?->avatar,
                    ],
                    'link' => "/admin/shipments/{$shipment->id}",
                ];
            }

            // Recent payments
            $recentPayments = Payment::with('user')
                ->where('status', 'released')
                ->latest('created_at')
                ->take(5)
                ->get();

            $currencyService = app(CurrencyService::class);
            foreach ($recentPayments as $payment) {
                $formatted = $currencyService->format($payment->amount, $payment->currency_code ?? 'EUR');
                $activities[] = [
                    'id' => "payment_completed-{$payment->id}",
                    'type' => 'payment_completed',
                    'description' => "Payment released: {$formatted}",
                    'timestamp' => $payment->created_at,
                    'user' => [
                        'name' => $payment->user?->name ?? 'Deleted User',
                        'avatar' => $payment->user?->avatar,
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
     * Get the exchange rate for the system default currency.
     */
    protected function getTargetRate(): float
    {
        $defaultCurrency = PlatformSetting::get('default_currency', 'EUR');
        return (float) (Currency::findByCode($defaultCurrency)?->exchange_rate ?? 1.0);
    }

    /**
     * Calculate revenue for the last 30 days, converted to system default currency.
     *
     * @return float
     */
    protected function getRevenue30Days(): float
    {
        $targetRate = $this->getTargetRate();

        return (float) Payment::where('payments.status', 'released')
            ->where('payments.created_at', '>=', now()->subDays(30))
            ->join('currencies', 'payments.currency_code', '=', 'currencies.code')
            ->selectRaw('SUM(payments.platform_fee * (? / currencies.exchange_rate)) as total', [$targetRate])
            ->value('total') ?? 0.0;
    }

    /**
     * Get chart data for dashboard with caching.
     *
     * @return array
     */
    public function getChartData(): array
    {
        return Cache::remember('admin_dashboard_charts', self::METRICS_CACHE_TTL, function () {
            return [
                'user_growth' => $this->getUserGrowthData(),
                'revenue_data' => $this->getRevenueData(),
                'shipment_status' => $this->getShipmentStatusDistribution(),
                'top_routes' => $this->getTopRoutes(),
            ];
        });
    }

    /**
     * Get user growth data for the last 30 days.
     *
     * @return array
     */
    protected function getUserGrowthData(): array
    {
        $data = [];
        $startDate = now()->subDays(29);

        for ($i = 0; $i < 30; $i++) {
            $date = $startDate->copy()->addDays($i);
            $count = User::where('role', 'user')->whereDate('created_at', $date->toDateString())->count();
            
            $data[] = [
                'date' => $date->toDateString(),
                'count' => $count,
            ];
        }

        return $data;
    }

    /**
     * Get revenue data for the last 30 days, converted to system default currency.
     *
     * @return array
     */
    protected function getRevenueData(): array
    {
        $targetRate = $this->getTargetRate();
        $data = [];
        $startDate = now()->subDays(29);

        for ($i = 0; $i < 30; $i++) {
            $date = $startDate->copy()->addDays($i);
            $amount = (float) Payment::where('payments.status', 'released')
                ->whereDate('payments.created_at', $date->toDateString())
                ->join('currencies', 'payments.currency_code', '=', 'currencies.code')
                ->selectRaw('SUM(payments.platform_fee * (? / currencies.exchange_rate)) as total', [$targetRate])
                ->value('total') ?? 0.0;

            $data[] = [
                'date' => $date->toDateString(),
                'amount' => $amount,
            ];
        }

        return $data;
    }

    /**
     * Get shipment status distribution.
     *
     * @return array
     */
    protected function getShipmentStatusDistribution(): array
    {
        $statuses = ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'];
        $data = [];

        foreach ($statuses as $status) {
            $count = Shipment::where('status', $status)->count();
            $data[] = [
                'status' => $status,
                'count' => $count,
            ];
        }

        return $data;
    }

    /**
     * Get top 5 routes by shipment count.
     *
     * @return array
     */
    protected function getTopRoutes(): array
    {
        $routes = DB::table('shipments')
            ->select('pickup_city', 'delivery_city', DB::raw('COUNT(*) as count'))
            ->groupBy('pickup_city', 'delivery_city')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return $routes->map(function ($route) {
            return [
                'route' => $route->pickup_city . ' → ' . $route->delivery_city,
                'count' => $route->count,
            ];
        })->toArray();
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
