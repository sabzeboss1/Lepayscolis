<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use App\Models\Rating;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PublicStatsController extends Controller
{
    /**
     * Get popular routes based on active trips
     * 
     * Returns the most popular routes (departure -> arrival combinations)
     * with trip counts and average delivery times
     * 
     * GET /api/popular-routes
     */
    public function popularRoutes(): JsonResponse
    {
        // Cache for 1 hour since this doesn't change frequently
        $routes = Cache::remember('popular_routes', 3600, function () {
            // Use julianday for SQLite compatibility, DATEDIFF for MySQL
            $driver = DB::connection()->getDriverName();
            $dateDiffSql = $driver === 'sqlite' 
                ? "julianday(arrival_date) - julianday(departure_date)"
                : "DATEDIFF(arrival_date, departure_date)";
            
            return Trip::select(
                'departure_country',
                'departure_city',
                'arrival_country',
                'arrival_city',
                DB::raw('COUNT(*) as trip_count'),
                DB::raw("AVG({$dateDiffSql}) as avg_delivery_days")
            )
            ->where('status', 'active')
            ->where('departure_date', '>=', now())
            ->groupBy('departure_country', 'departure_city', 'arrival_country', 'arrival_city')
            ->having('trip_count', '>=', 1)
            ->orderBy('trip_count', 'desc')
            ->limit(6)
            ->get()
            ->map(function ($route) {
                return [
                    'departure_city' => $route->departure_city,
                    'departure_country' => $route->departure_country,
                    'arrival_city' => $route->arrival_city,
                    'arrival_country' => $route->arrival_country,
                    'route' => "{$route->departure_city} ↔ {$route->arrival_city}",
                    'trip_count' => $route->trip_count,
                    'avg_delivery_days' => $route->avg_delivery_days ? round($route->avg_delivery_days) : null,
                    'delivery_time' => $route->avg_delivery_days 
                        ? round($route->avg_delivery_days) . '-' . (round($route->avg_delivery_days) + 2) . ' jours'
                        : '3-5 jours',
                ];
            });
        });

        // If no routes found, return empty array (frontend will use fallback)
        return response()->json([
            'data' => $routes,
        ]);
    }

    /**
     * Get featured testimonials (top ratings)
     * 
     * Returns the best ratings (5 stars with comments) for landing page
     * 
     * GET /api/testimonials
     */
    public function testimonials(): JsonResponse
    {
        // Cache for 30 minutes
        $testimonials = Cache::remember('featured_testimonials', 1800, function () {
            return Rating::with(['fromUser', 'toUser', 'shipment'])
                ->where('rating', 5) // Only 5-star ratings
                ->whereNotNull('comment') // Must have a comment
                ->where('comment', '!=', '') // Comment not empty
                ->whereHas('shipment', function ($query) {
                    $query->where('status', 'delivered'); // Only delivered shipments
                })
                ->inRandomOrder() // Random selection for variety
                ->limit(6)
                ->get()
                ->map(function ($rating) {
                    $shipment = $rating->shipment;
                    
                    return [
                        'id' => $rating->id,
                        'name' => $rating->fromUser->name ?? 'Utilisateur',
                        'rating' => $rating->rating,
                        'comment' => $rating->comment,
                        'location' => $shipment 
                            ? "{$shipment->pickup_city} → {$shipment->delivery_city}"
                            : 'Voyage international',
                        'avatar' => $rating->fromUser->avatar_url ?? null,
                        'created_at' => $rating->created_at->format('Y-m-d'),
                    ];
                });
        });

        // Calculate average rating and total count
        $stats = Cache::remember('rating_stats', 1800, function () {
            $avgRating = Rating::avg('rating');
            $totalRatings = Rating::count();
            
            return [
                'average_rating' => $avgRating ? round($avgRating, 1) : 4.8,
                'total_ratings' => $totalRatings ?: 0,
            ];
        });

        return response()->json([
            'data' => $testimonials,
            'stats' => $stats,
        ]);
    }

    /**
     * Get platform statistics
     * 
     * Returns general platform stats for landing page
     * 
     * GET /api/platform-stats
     */
    public function platformStats(): JsonResponse
    {
        $stats = Cache::remember('platform_stats', 1800, function () {
            return [
                'total_trips' => Trip::where('status', 'active')->count(),
                'active_routes' => Trip::select('departure_city', 'arrival_city')
                    ->where('status', 'active')
                    ->where('departure_date', '>=', now())
                    ->distinct()
                    ->count(),
                'countries_served' => Trip::select('departure_country')
                    ->union(Trip::select('arrival_country'))
                    ->distinct()
                    ->count(),
            ];
        });

        return response()->json([
            'data' => $stats,
        ]);
    }
}
