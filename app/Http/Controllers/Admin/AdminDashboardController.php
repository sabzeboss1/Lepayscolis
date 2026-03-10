<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\ActivityResource;
use App\Http\Resources\Admin\DashboardMetricsResource;
use App\Services\Admin\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    protected AdminDashboardService $dashboardService;

    public function __construct(AdminDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Get dashboard metrics
     */
    public function metrics(): JsonResponse
    {
        $metrics = $this->dashboardService->getMetrics();

        return response()->json([
            'data' => new DashboardMetricsResource($metrics),
        ], 200);
    }

    /**
     * Get chart data for dashboard
     */
    public function charts(): JsonResponse
    {
        $chartData = $this->dashboardService->getChartData();

        return response()->json([
            'data' => $chartData,
        ], 200);
    }

    /**
     * Get activity feed
     */
    public function activity(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 20);
        $activities = $this->dashboardService->getActivityFeed($limit);

        return response()->json([
            'data' => ActivityResource::collection($activities),
        ], 200);
    }
}
