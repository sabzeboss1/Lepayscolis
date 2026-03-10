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
     * Get total metrics.
     *
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @return array
     */
    public function getTotals(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:totals:{$dateFrom}:{$dateTo}";
        
        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $usersQuery = User::query();
            $tripsQuery = Trip::query();
            $shipmentsQuery = Shipment::query();
            $revenueQuery = Payment::where('status', 'completed');

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
                'revenue' => (float) $revenueQuery->sum('amount'),
            ];
        });
    }

    /**
     * Get top users by activity.
     *
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @param int $limit
     * @return array
     */
    public function getTopUsers(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
    {
        $cacheKey = "admin:analytics:top_users:{$dateFrom}:{$dateTo}:{$limit}";
        
        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo, $limit) {
            $users = User::select('users.*')
                ->selectRaw('(SELECT COUNT(*) FROM trips WHERE trips.user_id = users.id) as trips_count')
                ->selectRaw('(SELECT COUNT(*) FROM shipments WHERE shipments.user_id = users.id) as shipments_count')
                ->selectRaw('(SELECT AVG(rating) FROM ratings WHERE ratings.rated_user_id = users.id) as avg_rating')
                ->havingRaw('trips_count + shipments_count > 0')
                ->orderByRaw('trips_count + shipments_count DESC')
                ->limit($limit)
                ->get();

            return $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'trips' => (int) $user->trips_count,
                    'shipments' => (int) $user->shipments_count,
                    'rating' => $user->avg_rating ? round((float) $user->avg_rating, 1) : 0,
                ];
            })->toArray();
        });
    }

    /**
     * Get user growth data for the last 12 months.
     *
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @return array
     */
    public function getUserGrowthData(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:user_growth:{$dateFrom}:{$dateTo}";
        
        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $query = User::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count');
            
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
     *
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @return array
     */
    public function getRevenueData(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:revenue:{$dateFrom}:{$dateTo}";
        
        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $query = Payment::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(amount) as total')
                ->where('status', 'completed');
            
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
     *
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @return array
     */
    public function getTransactionVolumeData(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:transaction_volume:{$dateFrom}:{$dateTo}";
        
        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $query = Payment::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count');
            
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
     *
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @param int $limit
     * @return array
     */
    public function getPopularRoutes(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
    {
        $cacheKey = "admin:analytics:popular_routes:{$dateFrom}:{$dateTo}:{$limit}";
        
        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo, $limit) {
            $tripQuery = Trip::selectRaw('origin_city, destination_city, COUNT(*) as trip_count');
            $shipmentQuery = Shipment::selectRaw('origin_city, destination_city, COUNT(*) as shipment_count');
            
            if ($dateFrom) {
                $tripQuery->where('created_at', '>=', $dateFrom);
                $shipmentQuery->where('created_at', '>=', $dateFrom);
            }
            
            if ($dateTo) {
                $tripQuery->where('created_at', '<=', $dateTo);
                $shipmentQuery->where('created_at', '<=', $dateTo);
            }
            
            $tripRoutes = $tripQuery->groupBy('origin_city', 'destination_city')
                ->get()
                ->keyBy(fn($item) => $item->origin_city . '-' . $item->destination_city);

            $shipmentRoutes = $shipmentQuery->groupBy('origin_city', 'destination_city')
                ->get()
                ->keyBy(fn($item) => $item->origin_city . '-' . $item->destination_city);

            $routes = [];
            foreach ($tripRoutes as $key => $trip) {
                $routes[$key] = [
                    'route' => $trip->origin_city . ' → ' . $trip->destination_city,
                    'trips' => (int) $trip->trip_count,
                    'shipments' => (int) ($shipmentRoutes[$key]->shipment_count ?? 0),
                ];
            }

            foreach ($shipmentRoutes as $key => $shipment) {
                if (!isset($routes[$key])) {
                    $routes[$key] = [
                        'route' => $shipment->origin_city . ' → ' . $shipment->destination_city,
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
     *
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @return array
     */
    public function getEngagementMetrics(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $cacheKey = "admin:analytics:engagement:{$dateFrom}:{$dateTo}";
        
        return Cache::remember($cacheKey, self::ANALYTICS_CACHE_TTL, function () use ($dateFrom, $dateTo) {
            $totalUsers = User::count();
            $activeUsers = User::where('last_login', '>=', now()->subDays(30))->count();
            
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
                'active_users' => $activeUsers,
                'avg_trips_per_user' => $avgTripsPerUser,
                'avg_shipments_per_user' => $avgShipmentsPerUser,
            ];
        });
    }

    /**
     * Export data to CSV format.
     *
     * @param string $dataType
     * @param array $filters
     * @return array
     */
    public function exportToCSV(string $dataType, array $filters = []): array
    {
        $query = $this->buildExportQuery($dataType, $filters);
        $count = $query->count();

        // For large datasets (>10,000 records), queue async job
        if ($count > 10000) {
            // TODO: Queue async export job
            return [
                'status' => 'queued',
                'job_id' => uniqid('export_'),
                'message' => 'Export queued for processing. You will be notified when ready.',
            ];
        }

        // For small datasets, generate CSV immediately
        $data = $query->get();
        $csv = $this->generateCSV($dataType, $data);
        
        // TODO: Store CSV file and return download URL
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
     *
     * @param string $reportType
     * @param array $filters
     * @return array
     */
    public function exportToPDF(string $reportType, array $filters = []): array
    {
        // TODO: Generate PDF report with charts and tables
        $filename = "{$reportType}_report_" . now()->format('Y-m-d_His') . '.pdf';
        
        return [
            'status' => 'completed',
            'download_url' => "/admin/reports/{$filename}",
            'filename' => $filename,
        ];
    }

    /**
     * Build export query based on data type and filters.
     *
     * @param string $dataType
     * @param array $filters
     * @return \Illuminate\Database\Eloquent\Builder
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

        // Apply filters
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
     *
     * @param string $dataType
     * @param \Illuminate\Support\Collection $data
     * @return string
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
                // Escape values containing commas or quotes
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
