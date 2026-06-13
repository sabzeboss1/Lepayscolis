<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminShipmentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminShipmentRequestController extends Controller
{
    protected AdminShipmentRequestService $shipmentRequestService;

    public function __construct(AdminShipmentRequestService $shipmentRequestService)
    {
        $this->shipmentRequestService = $shipmentRequestService;
    }

    /**
     * Get all shipment requests with filters
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status', 'from_date', 'to_date']);
        $perPage = $request->input('per_page', 50);

        $shipmentRequests = $this->shipmentRequestService->getShipmentRequests($filters, $perPage);

        return response()->json([
            'data' => $shipmentRequests->items(),
            'meta' => [
                'current_page' => $shipmentRequests->currentPage(),
                'last_page' => $shipmentRequests->lastPage(),
                'per_page' => $shipmentRequests->perPage(),
                'total' => $shipmentRequests->total(),
            ],
        ], 200);
    }

    /**
     * Get shipment request details
     */
    public function show(string $id): JsonResponse
    {
        $shipmentRequest = $this->shipmentRequestService->getShipmentRequestDetails($id);

        return response()->json(['data' => $shipmentRequest], 200);
    }

    /**
     * Get pending shipment requests
     */
    public function pending(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 50);
        $shipmentRequests = $this->shipmentRequestService->getPendingShipmentRequests($perPage);

        return response()->json([
            'data' => $shipmentRequests->items(),
            'meta' => [
                'current_page' => $shipmentRequests->currentPage(),
                'last_page' => $shipmentRequests->lastPage(),
                'per_page' => $shipmentRequests->perPage(),
                'total' => $shipmentRequests->total(),
            ],
        ], 200);
    }

    /**
     * Approve a shipment request
     */
    public function approve(string $id, Request $request): JsonResponse
    {
        try {
            $shipmentRequest = $this->shipmentRequestService->approveShipmentRequest($id, $request->user());

            return response()->json([
                'data' => $shipmentRequest,
                'message' => 'Shipment request approved successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reject a shipment request
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $shipmentRequest = $this->shipmentRequestService->rejectShipmentRequest(
                $id,
                $request->reason,
                $request->user()
            );

            return response()->json([
                'data' => $shipmentRequest,
                'message' => 'Shipment request rejected successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a shipment request
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $this->shipmentRequestService->deleteShipmentRequest(
                $id,
                $request->input('reason', 'Supprimé par administrateur'),
                $request->user()
            );

            return response()->json([
                'message' => 'Shipment request deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Bulk delete shipment requests
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'string|exists:shipment_requests,id',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $count = $this->shipmentRequestService->bulkDeleteShipmentRequests(
                $request->ids,
                $request->input('reason', 'Suppression en masse par administrateur'),
                $request->user()
            );

            return response()->json([
                'message' => "{$count} shipment request(s) deleted successfully",
                'count' => $count,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get shipment request analytics
     */
    public function analytics(): JsonResponse
    {
        $analytics = $this->shipmentRequestService->getShipmentRequestAnalytics();

        return response()->json(['data' => $analytics], 200);
    }
}
