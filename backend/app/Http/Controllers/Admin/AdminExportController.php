<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminExportController extends Controller
{
    protected AdminAnalyticsService $analyticsService;

    public function __construct(AdminAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function users(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status', 'kyc_status']);
        return $this->streamCsv('users', $filters);
    }

    public function trips(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('trips', $filters);
    }

    public function shipments(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('shipments', $filters);
    }

    public function payments(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('payments', $filters);
    }

    public function withdrawals(Request $request): StreamedResponse|JsonResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'status']);
        return $this->streamCsv('withdrawals', $filters);
    }

    /**
     * Stream CSV export as a download response.
     */
    private function streamCsv(string $dataType, array $filters): StreamedResponse|JsonResponse
    {
        $result = $this->analyticsService->exportToCSV($dataType, $filters);

        // Large datasets are queued — return JSON with job info
        if ($result['status'] === 'queued') {
            return response()->json($result, 200);
        }

        $filename = $result['filename'];
        $csv = $result['csv'] ?? '';

        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
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
