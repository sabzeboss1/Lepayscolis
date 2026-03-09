<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CancelTripRequest;
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
        $filters = $request->only(['search', 'status', 'origin', 'destination']);
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

    public function show(int $id): JsonResponse
    {
        $trip = $this->tripService->getTripDetails($id);

        return response()->json(['data' => $trip], 200);
    }

    public function update(UpdateTripRequest $request, int $id): JsonResponse
    {
        $trip = $this->tripService->updateTrip($id, $request->validated(), $request->user());

        return response()->json([
            'data' => new AdminTripResource($trip),
            'message' => 'Trip updated successfully',
        ], 200);
    }

    public function cancel(CancelTripRequest $request, int $id): JsonResponse
    {
        $trip = $this->tripService->cancelTrip($id, $request->reason, $request->user());

        return response()->json([
            'data' => new AdminTripResource($trip),
            'message' => 'Trip cancelled successfully',
        ], 200);
    }

    public function analytics(): JsonResponse
    {
        $analytics = $this->tripService->getTripAnalytics();

        return response()->json(['data' => $analytics], 200);
    }
}
