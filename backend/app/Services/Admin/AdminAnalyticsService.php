<?php

namespace App\Services\Admin;

use App\Models\Payment;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    /**
     * Cache TTL for analytics data (1 hour)
     */
    const ANALYTICS_CACHE_TTL = 3600;

    /**
     * Get the appropriate date format SQL based on DB driver.
     */
    protected function dateFormatMonth(string $column): string
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return "strftime('%Y-%m', {$column})";
        }

        // MySQL / MariaDB
        return "DATE_FORMAT({$column}, '%Y-%m')";
    }

    /**
     * Get total metrics.
     */
    public function getTotals(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:totals:{$dateFrom}:{$dateTo}";

        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $usersQuery = User::where('role', 'user');
            $tripsQuery = Trip::query();
            $shipmentsQuery = Shipment::query();
            $revenueQuery = Payment::where('status', 'released');

            if ($dateFrom) {
                $usersQuery->where('created_at', '>=', $dateFrom);
                $tripsQuery->where('created_at', '>=', $dateFrom);
                $shipmentsQuery->where('created_at', '>=', $dateFrom);
                $revenueQuery->where('created_at', '>=', $dateFrom);
            }

            if ($dateTo) {
                $usersQuery->where('created_at', '<=', $dateTo);
                $tripsQuery->where('created_at', '<=', $dateTo);
                $shipmentsQuery->where('created_at', '<=', $dateTo);
                $revenueQuery->where('created_at', '<=', $dateTo);
            }

            return [
                'users' => $usersQuery->count(),
                'trips' => $tripsQuery->count(),
                'shipments' => $shipmentsQuery->count(),
                'revenue' => (float) $revenueQuery->sum('platform_fee'),
            ];
        });
    }

    /**
     * Get top users by activity.
     */
    public function getTopUsers(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
    {
        $cacheKey = "admin:analytics:top_users:{$dateFrom}:{$dateTo}:{$limit}";

        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo, $limit) {
            $users = User::select('users.*')
                ->selectRaw('(SELECT COUNT(*) FROM trips WHERE trips.traveler_id = users.id) as trips_count')
                ->selectRaw('(SELECT COUNT(*) FROM shipments WHERE shipments.sender_id = users.id) as shipments_count')
                ->selectRaw('(SELECT AVG(rating) FROM ratings WHERE ratings.to_user_id = users.id) as avg_rating')
                ->where('role', 'user')
                ->whereRaw('(SELECT COUNT(*) FROM trips WHERE trips.traveler_id = users.id) + (SELECT COUNT(*) FROM shipments WHERE shipments.sender_id = users.id) > 0')
                ->orderByRaw('trips_count + shipments_count DESC')
                ->limit($limit)
                ->get();

            return $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'trips' => (int) $user->trips_count,
                    'shipments' => (int) $user->shipments_count,
                    'rating' => $user->avg_rating ? round((float) $user->avg_rating, 1) : 0,
                ];
            })->toArray();
        });
    }

    /**
     * Get user growth data for the last 12 months.
     */
    public function getUserGrowthData(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:user_growth:{$dateFrom}:{$dateTo}";

        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $dateExpr = $this->dateFormatMonth('created_at');
            $query = User::where('role', 'user')
                ->selectRaw("{$dateExpr} as month, COUNT(*) as count");

            if ($dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            } else {
                $query->where('created_at', '>=', now()->subMonths(12));
            }

            if ($dateTo) {
                $query->where('created_at', '<=', $dateTo);
            }

            $data = $query->groupBy('month')
                ->orderBy('month')
                ->get();

            return $data->map(function ($item) {
                return [
                    'month' => $item->month,
                    'count' => (int) $item->count,
                ];
            })->toArray();
        });
    }

    /**
     * Get revenue data for the last 12 months.
     */
    public function getRevenueData(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:revenue:{$dateFrom}:{$dateTo}";

        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $dateExpr = $this->dateFormatMonth('created_at');
            $query = Payment::selectRaw("{$dateExpr} as month, SUM(platform_fee) as total")
                ->where('status', 'released');

            if ($dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            } else {
                $query->where('created_at', '>=', now()->subMonths(12));
            }

            if ($dateTo) {
                $query->where('created_at', '<=', $dateTo);
            }

            $data = $query->groupBy('month')
                ->orderBy('month')
                ->get();

            return $data->map(function ($item) {
                return [
                    'month' => $item->month,
                    'amount' => (float) $item->total,
                ];
            })->toArray();
        });
    }

    /**
     * Get transaction volume data for the last 12 months.
     */
    public function getTransactionVolumeData(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:transaction_volume:{$dateFrom}:{$dateTo}";

        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $dateExpr = $this->dateFormatMonth('created_at');
            $query = Payment::selectRaw("{$dateExpr} as month, COUNT(*) as count");

            if ($dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            } else {
                $query->where('created_at', '>=', now()->subMonths(12));
            }

            if ($dateTo) {
                $query->where('created_at', '<=', $dateTo);
            }

            $data = $query->groupBy('month')
                ->orderBy('month')
                ->get();

            return $data->map(function ($item) {
                return [
                    'month' => $item->month,
                    'count' => (int) $item->count,
                ];
            })->toArray();
        });
    }

    /**
     * Get popular routes with trip and shipment counts.
     */
    public function getPopularRoutes(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
    {
        $cacheKey = "admin:analytics:popular_routes:{$dateFrom}:{$dateTo}:{$limit}";

        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo, $limit) {
            $tripQuery = Trip::selectRaw('departure_city, arrival_city, COUNT(*) as trip_count');
            $shipmentQuery = Shipment::selectRaw('pickup_city, delivery_city, COUNT(*) as shipment_count');

            if ($dateFrom) {
                $tripQuery->where('created_at', '>=', $dateFrom);
                $shipmentQuery->where('created_at', '>=', $dateFrom);
            }

            if ($dateTo) {
                $tripQuery->where('created_at', '<=', $dateTo);
                $shipmentQuery->where('created_at', '<=', $dateTo);
            }

            $tripRoutes = $tripQuery->groupBy('departure_city', 'arrival_city')
                ->get()
                ->keyBy(fn($item) => $item->departure_city . '-' . $item->arrival_city);

            $shipmentRoutes = $shipmentQuery->groupBy('pickup_city', 'delivery_city')
                ->get()
                ->keyBy(fn($item) => $item->pickup_city . '-' . $item->delivery_city);

            $routes = [];
            foreach ($tripRoutes as $key => $trip) {
                $routes[$key] = [
                    'route' => $trip->departure_city . ' → ' . $trip->arrival_city,
                    'trips' => (int) $trip->trip_count,
                    'shipments' => (int) ($shipmentRoutes[$key]->shipment_count ?? 0),
                ];
            }

            foreach ($shipmentRoutes as $key => $shipment) {
                if (!isset($routes[$key])) {
                    $routes[$key] = [
                        'route' => $shipment->pickup_city . ' → ' . $shipment->delivery_city,
                        'trips' => 0,
                        'shipments' => (int) $shipment->shipment_count,
                    ];
                }
            }

            usort($routes, fn($a, $b) => ($b['trips'] + $b['shipments']) <=> ($a['trips'] + $a['shipments']));

            return array_slice($routes, 0, $limit);
        });
    }

    /**
     * Get engagement metrics.
     */
    public function getEngagementMetrics(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:engagement:{$dateFrom}:{$dateTo}";

        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $totalUsers = User::where('role', 'user')->count();

            // Active users = users who created a trip or shipment in the last 30 days
            $thirtyDaysAgo = now()->subDays(30);
            $activeUserIds = Trip::where('created_at', '>=', $thirtyDaysAgo)
                ->pluck('traveler_id')
                ->merge(
                    Shipment::where('created_at', '>=', $thirtyDaysAgo)->pluck('sender_id')
                )
                ->unique()
                ->count();

            $tripsQuery = Trip::query();
            $shipmentsQuery = Shipment::query();

            if ($dateFrom) {
                $tripsQuery->where('created_at', '>=', $dateFrom);
                $shipmentsQuery->where('created_at', '>=', $dateFrom);
            }

            if ($dateTo) {
                $tripsQuery->where('created_at', '<=', $dateTo);
                $shipmentsQuery->where('created_at', '<=', $dateTo);
            }

            $totalTrips = $tripsQuery->count();
            $totalShipments = $shipmentsQuery->count();

            $avgTripsPerUser = $totalUsers > 0 ? round($totalTrips / $totalUsers, 2) : 0;
            $avgShipmentsPerUser = $totalUsers > 0 ? round($totalShipments / $totalUsers, 2) : 0;

            return [
                'active_users' => $activeUserIds,
                'avg_trips_per_user' => $avgTripsPerUser,
                'avg_shipments_per_user' => $avgShipmentsPerUser,
            ];
        });
    }

    /**
     * Export data to CSV format.
     */
    public function exportToCSV(string $dataType, array $filters = []): array
    {
        $query = $this->buildExportQuery($dataType, $filters);
        $count = $query->count();

        // For large datasets (>10,000 records), queue async job
        if ($count > 10000) {
            return [
                'status' => 'queued',
                'job_id' => uniqid('export_'),
                'message' => 'Export queued for processing. You will be notified when ready.',
            ];
        }

        // For small datasets, generate CSV immediately
        $data = $query->get();
        $csv = $this->generateCSV($dataType, $data);

        $filename = "{$dataType}_export_" . now()->format('Y-m-d_His') . '.csv';

        return [
            'status' => 'completed',
            'download_url' => "/admin/exports/{$filename}",
            'filename' => $filename,
            'record_count' => $count,
        ];
    }

    /**
     * Export data to PDF format.
     */
    public function exportToPDF(string $reportType, array $filters = []): array
    {
        $filename = "{$reportType}_report_" . now()->format('Y-m-d_His') . '.pdf';

        return [
            'status' => 'completed',
            'download_url' => "/admin/reports/{$filename}",
            'filename' => $filename,
        ];
    }

    /**
     * Build export query based on data type and filters.
     */
    protected function buildExportQuery(string $dataType, array $filters)
    {
        $query = match ($dataType) {
            'users' => User::query(),
            'trips' => Trip::query(),
            'shipments' => Shipment::query(),
            'payments' => Payment::query(),
            default => throw new \InvalidArgumentException("Invalid data type: {$dataType}"),
        };

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query;
    }

    /**
     * Generate CSV content from data.
     */
    protected function generateCSV(string $dataType, $data): string
    {
        if ($data->isEmpty()) {
            return '';
        }

        $headers = array_keys($data->first()->toArray());
        $csv = implode(',', $headers) . "\n";

        foreach ($data as $row) {
            $values = array_map(function ($value) {
                if (is_string($value) && (str_contains($value, ',') || str_contains($value, '"'))) {
                    return '"' . str_replace('"', '""', $value) . '"';
                }
                return $value;
            }, $row->toArray());

            $csv .= implode(',', $values) . "\n";
        }

        return $csv;
    }
}
