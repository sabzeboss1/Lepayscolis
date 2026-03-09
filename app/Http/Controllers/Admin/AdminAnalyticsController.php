<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AnalyticsDataResource;
use App\Services\Admin\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnalyticsController extends Controller
{
    protected AdminAnalyticsService $analyticsService;

    public function __construct(AdminAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get consolidated analytics data
     */
    public function index(Request $request): JsonResponse
    {
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $data = [
            'totals' => $this->analyticsService->getTotals($dateFrom, $dateTo),
            'user_growth' => $this->analyticsService->getUserGrowthData($dateFrom, $dateTo),
            'revenue' => $this->analyticsService->getRevenueData($dateFrom, $dateTo),
            'transaction_volume' => $this->analyticsService->getTransactionVolumeData($dateFrom, $dateTo),
            'popular_routes' => $this->analyticsService->getPopularRoutes($dateFrom, $dateTo),
            'top_users' => $this->analyticsService->getTopUsers($dateFrom, $dateTo),
            'engagement' => $this->analyticsService->getEngagementMetrics($dateFrom, $dateTo),
        ];

        return response()->json(['data' => $data], 200);
    }

    public function users(): JsonResponse
    {
        $data = $this->analyticsService->getUserGrowthData();

        return response()->json(['data' => new AnalyticsDataResource($data)], 200);
    }

    public function revenue(): JsonResponse
    {
        $data = $this->analyticsService->getRevenueData();

        return response()->json(['data' => new AnalyticsDataResource($data)], 200);
    }

    public function transactions(): JsonResponse
    {
        $data = $this->analyticsService->getTransactionVolumeData();

        return response()->json(['data' => new AnalyticsDataResource($data)], 200);
    }

    public function routes(): JsonResponse
    {
        $data = $this->analyticsService->getPopularRoutes();

        return response()->json(['data' => $data], 200);
    }

    public function engagement(): JsonResponse
    {
        $data = $this->analyticsService->getEngagementMetrics();

        return response()->json(['data' => new AnalyticsDataResource($data)], 200);
    }

    public function export(Request $request): JsonResponse
    {
        $dataType = $request->input('type');
        $filters = $request->only(['date_from', 'date_to', 'status']);
        $format = $request->input('format', 'csv');

        if ($format === 'pdf') {
            $result = $this->analyticsService->exportToPDF($dataType, $filters);
        } else {
            $result = $this->analyticsService->exportToCSV($dataType, $filters);
        }

        return response()->json($result, 200);
    }
}
