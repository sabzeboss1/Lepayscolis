<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkKYCRequest;
use App\Http\Requests\Admin\RejectKYCRequest;
use App\Http\Resources\Admin\KYCSubmissionResource;
use App\Services\Admin\AdminKYCService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminKYCController extends Controller
{
    protected AdminKYCService $kycService;

    public function __construct(AdminKYCService $kycService)
    {
        $this->kycService = $kycService;
    }

    /**
     * Get paginated list of KYC submissions
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'date_from', 'date_to']);
        $perPage = $request->input('per_page', 50);

        $submissions = $this->kycService->getKYCSubmissions($filters, $perPage);

        return response()->json([
            'data' => KYCSubmissionResource::collection($submissions),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'last_page' => $submissions->lastPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
            ],
        ], 200);
    }

    /**
     * Get KYC submission details
     */
    public function show(string $id): JsonResponse
    {
        $kyc = $this->kycService->getKYCDetails($id);

        return response()->json([
            'data' => new KYCSubmissionResource($kyc),
        ], 200);
    }

    /**
     * Approve KYC submission
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $kyc = $this->kycService->approveKYC($id, $request->user());

        return response()->json([
            'data' => new KYCSubmissionResource($kyc),
            'message' => 'KYC approved successfully',
        ], 200);
    }

    /**
     * Reject KYC submission
     */
    public function reject(RejectKYCRequest $request, string $id): JsonResponse
    {
        $kyc = $this->kycService->rejectKYC($id, $request->reason, $request->user());

        return response()->json([
            'data' => new KYCSubmissionResource($kyc),
            'message' => 'KYC rejected successfully',
        ], 200);
    }

    /**
     * Bulk approve KYC submissions
     */
    public function bulkApprove(BulkKYCRequest $request): JsonResponse
    {
        $result = $this->kycService->bulkApproveKYC($request->ids, $request->user());

        return response()->json([
            'approved' => $result['approved'],
            'failed' => $result['failed'],
            'message' => count($result['approved']) . ' KYC submissions approved successfully',
        ], 200);
    }

    /**
     * Bulk reject KYC submissions
     */
    public function bulkReject(BulkKYCRequest $request): JsonResponse
    {
        $result = $this->kycService->bulkRejectKYC($request->ids, $request->reason, $request->user());

        return response()->json([
            'rejected' => $result['rejected'],
            'failed' => $result['failed'],
            'message' => count($result['rejected']) . ' KYC submissions rejected successfully',
        ], 200);
    }
}
