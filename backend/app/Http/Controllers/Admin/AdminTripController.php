<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkTripVerificationRequest;
use App\Http\Requests\Admin\CancelTripRequest;
use App\Http\Requests\Admin\RejectTripRequest;
use App\Http\Requests\Admin\UpdateTripRequest;
use App\Http\Resources\Admin\AdminTripResource;
use App\Services\Admin\AdminTripService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTripController extends Controller
{
    protected AdminTripService $tripService;

    public function __construct(AdminTripService $tripService)
    {
        $this->tripService = $tripService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status', 'verification_status', 'origin', 'destination']);
        $perPage = $request->input('per_page', 50);

        $trips = $this->tripService->getTrips($filters, $perPage);

        return response()->json([
            'data' => AdminTripResource::collection($trips),
            'meta' => [
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
                'per_page' => $trips->perPage(),
                'total' => $trips->total(),
            ],
        ], 200);
    }

    public function show(string $id): JsonResponse
    {
        $trip = $this->tripService->getTripDetails($id);

        return response()->json(['data' => $trip], 200);
    }

    public function update(UpdateTripRequest $request, string $id): JsonResponse
    {
        $trip = $this->tripService->updateTrip($id, $request->validated(), $request->user());

        return response()->json([
            'data' => new AdminTripResource($trip),
            'message' => 'Trip updated successfully',
        ], 200);
    }

    public function cancel(CancelTripRequest $request, string $id): JsonResponse
    {
        $trip = $this->tripService->cancelTrip($id, $request->reason, $request->user());

        return response()->json([
            'data' => new AdminTripResource($trip),
            'message' => 'Trip cancelled successfully',
        ], 200);
    }

    public function pending(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 50);
        $trips = $this->tripService->getPendingTrips($perPage);

        return response()->json([
            'data' => AdminTripResource::collection($trips),
            'meta' => [
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
                'per_page' => $trips->perPage(),
                'total' => $trips->total(),
            ],
        ], 200);
    }

    public function verify(Request $request, string $id): JsonResponse
    {
        $trip = $this->tripService->verifyTrip($id, $request->user());

        return response()->json([
            'data' => new AdminTripResource($trip),
            'message' => __('messages.trip.verified'),
        ], 200);
    }

    public function reject(RejectTripRequest $request, string $id): JsonResponse
    {
        $trip = $this->tripService->rejectTrip($id, $request->reason, $request->user());

        return response()->json([
            'data' => new AdminTripResource($trip),
            'message' => __('messages.trip.rejected'),
        ], 200);
    }

    public function bulkVerify(BulkTripVerificationRequest $request): JsonResponse
    {
        $result = $this->tripService->bulkVerifyTrips($request->ids, $request->user());

        return response()->json([
            'verified' => $result['verified'],
            'failed' => $result['failed'],
            'message' => count($result['verified']) . ' trip(s) verified successfully',
        ], 200);
    }

    public function bulkReject(BulkTripVerificationRequest $request): JsonResponse
    {
        $result = $this->tripService->bulkRejectTrips($request->ids, $request->reason, $request->user());

        return response()->json([
            'rejected' => $result['rejected'],
            'failed' => $result['failed'],
            'message' => count($result['rejected']) . ' trip(s) rejected successfully',
        ], 200);
    }

    public function destroy(string $id, Request $request): JsonResponse
    {
        try {
            $this->tripService->deleteTrip($id, $request->user());

            return response()->json([
                'message' => 'Trip deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|string|exists:trips,id',
        ]);

        $result = $this->tripService->bulkDeleteTrips($request->ids, $request->user());

        return response()->json([
            'deleted' => $result['deleted'],
            'failed' => $result['failed'],
            'message' => count($result['deleted']) . ' trip(s) deleted successfully',
        ], 200);
    }

    public function analytics(): JsonResponse
    {
        $analytics = $this->tripService->getTripAnalytics();

        return response()->json(['data' => $analytics], 200);
    }
}
