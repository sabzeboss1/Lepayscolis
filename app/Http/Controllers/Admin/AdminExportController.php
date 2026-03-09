<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminExportController extends Controller
{
    protected AdminAnalyticsService $analyticsService;

    public function __construct(AdminAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function users(Request $request): JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status', 'kyc_status']);
        
        $result = $this->analyticsService->exportToCSV('users', $filters);

        return response()->json($result, 200);
    }

    public function trips(Request $request): JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        
        $result = $this->analyticsService->exportToCSV('trips', $filters);

        return response()->json($result, 200);
    }

    public function shipments(Request $request): JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        
        $result = $this->analyticsService->exportToCSV('shipments', $filters);

        return response()->json($result, 200);
    }

    public function payments(Request $request): JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        
        $result = $this->analyticsService->exportToCSV('payments', $filters);

        return response()->json($result, 200);
    }

    public function withdrawals(Request $request): JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        
        $result = $this->analyticsService->exportToCSV('withdrawals', $filters);

        return response()->json($result, 200);
    }

    public function status(string $jobId): JsonResponse
    {
        // TODO: Implement job status checking
        return response()->json([
            'job_id' => $jobId,
            'status' => 'processing',
            'message' => 'Export is being processed',
        ], 200);
    }
}
