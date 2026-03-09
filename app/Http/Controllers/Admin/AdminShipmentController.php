<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CancelShipmentRequest;
use App\Http\Requests\Admin\ResolveDisputeRequest;
use App\Http\Resources\Admin\AdminShipmentResource;
use App\Services\Admin\AdminShipmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminShipmentController extends Controller
{
    protected AdminShipmentService $shipmentService;

    public function __construct(AdminShipmentService $shipmentService)
    {
        $this->shipmentService = $shipmentService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status']);
        $perPage = $request->input('per_page', 50);

        $shipments = $this->shipmentService->getShipments($filters, $perPage);

        return response()->json([
            'data' => AdminShipmentResource::collection($shipments),
            'meta' => [
                'current_page' => $shipments->currentPage(),
                'last_page' => $shipments->lastPage(),
                'per_page' => $shipments->perPage(),
                'total' => $shipments->total(),
            ],
        ], 200);
    }

    public function show(int $id): JsonResponse
    {
        $shipment = $this->shipmentService->getShipmentDetails($id);

        return response()->json(['data' => $shipment], 200);
    }

    public function resolveDispute(ResolveDisputeRequest $request, int $id): JsonResponse
    {
        $shipment = $this->shipmentService->resolveDispute(
            $id,
            $request->resolution_notes,
            $request->refund_amount,
            $request->user()
        );

        return response()->json([
            'data' => new AdminShipmentResource($shipment),
            'message' => 'Dispute resolved successfully',
        ], 200);
    }

    public function cancel(CancelShipmentRequest $request, int $id): JsonResponse
    {
        $shipment = $this->shipmentService->cancelShipment($id, $request->reason, $request->user());

        return response()->json([
            'data' => new AdminShipmentResource($shipment),
            'message' => 'Shipment cancelled successfully',
        ], 200);
    }

    public function analytics(): JsonResponse
    {
        $analytics = $this->shipmentService->getShipmentAnalytics();

        return response()->json(['data' => $analytics], 200);
    }
}
