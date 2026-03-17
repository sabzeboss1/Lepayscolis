<?php

namespace App\Http\Controllers;

use App\Http\Requests\Shipment\AcceptShipmentRequest;
use App\Http\Requests\Shipment\CreateShipmentRequest;
use App\Http\Requests\Shipment\UpdateShipmentRequest;
use App\Http\Resources\ShipmentResource;
use App\Models\City;
use App\Models\Country;
use App\Models\Shipment;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * ShipmentController - Handle shipment CRUD operations
 * 
 * Endpoints:
 * - GET /api/shipments: list shipments with filters
 * - POST /api/shipments: create shipment (requires auth + KYC)
 * - GET /api/shipments/{id}: get shipment details
 * - GET /api/shipments/my: get user's shipments
 * - PUT /api/shipments/{id}: update shipment status
 * - POST /api/shipments/{id}/accept: traveler accepts shipment
 * - POST /api/shipments/{id}/reject: traveler rejects shipment
 * - POST /api/shipments/{id}/confirm-delivery: confirm delivery
 * 
 * Validates Requirements: 4.1-4.19
 */
class ShipmentController extends Controller
{
    /**
     * List shipments with filters and pagination.
     * 
     * GET /api/shipments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Shipment::with(['sender', 'traveler', 'trip', 'pickupCountry', 'pickupCity', 'deliveryCountry', 'deliveryCity']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Paginate results (15 per page)
        $shipments = $query->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => ShipmentResource::collection($shipments->items()),
            'meta' => [
                'current_page' => $shipments->currentPage(),
                'last_page' => $shipments->lastPage(),
                'per_page' => $shipments->perPage(),
                'total' => $shipments->total(),
            ],
        ]);
    }

    /**
     * Create a new shipment.
     * 
     * POST /api/shipments
     * Requires: auth:sanctum, kyc.verified
     */
    public function store(CreateShipmentRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            // Auto-populate text fields from country/city IDs
            $data = $this->resolveLocationNames($data, 'pickup');
            $data = $this->resolveLocationNames($data, 'delivery');

            $shipment = new Shipment($data);
            $shipment->sender_id = auth()->id();
            $shipment->status = 'pending';
            $shipment->payment_status = 'pending';

            // Payment amount will be calculated when shipment is accepted
            // For now, set to 0
            $shipment->payment_amount = 0;

            $shipment->save();

            return response()->json([
                'message' => 'Shipment created successfully.',
                'data' => new ShipmentResource($shipment),
            ], 201);
        });
    }

    /**
     * Get shipment details.
     * 
     * GET /api/shipments/{id}
     */
    public function show(string $id): JsonResponse
    {
        $shipment = Shipment::with(['sender', 'traveler', 'trip.traveler', 'pickupCountry', 'pickupCity', 'deliveryCountry', 'deliveryCity'])
            ->findOrFail($id);

        return response()->json([
            'data' => new ShipmentResource($shipment),
        ]);
    }

    /**
     * Get authenticated user's shipments (as sender or traveler).
     * 
     * GET /api/shipments/my
     * Requires: auth:sanctum
     */
    public function myShipments(Request $request): JsonResponse
    {
        $userId = auth()->id();

        $query = Shipment::with(['sender', 'traveler', 'trip', 'pickupCountry', 'pickupCity', 'deliveryCountry', 'deliveryCity'])
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)
                  ->orWhere('traveler_id', $userId);
            });

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $shipments = $query->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => ShipmentResource::collection($shipments->items()),
            'meta' => [
                'current_page' => $shipments->currentPage(),
                'last_page' => $shipments->lastPage(),
                'per_page' => $shipments->perPage(),
                'total' => $shipments->total(),
            ],
        ]);
    }

    /**
     * Update shipment status.
     * 
     * PUT /api/shipments/{id}
     * Requires: auth:sanctum, shipment.access
     */
    public function update(UpdateShipmentRequest $request, string $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $shipment = Shipment::findOrFail($id);

            // Restore trip capacity if transitioning from accepted to cancelled
            if ($request->status === 'cancelled' && $shipment->status === 'accepted' && $shipment->trip_id) {
                $trip = $shipment->trip;
                $trip->available_capacity += $shipment->package_weight;
                $trip->save();
            }

            $shipment->status = $request->status;
            $shipment->save();

            return response()->json([
                'message' => __('messages.shipment.updated'),
                'data' => new ShipmentResource($shipment->load(['sender', 'traveler', 'trip'])),
            ]);
        });
    }

    /**
     * Traveler accepts shipment.
     * 
     * POST /api/shipments/{id}/accept
     * Requires: auth:sanctum
     */
    public function accept(AcceptShipmentRequest $request, string $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $shipment = Shipment::findOrFail($id);
            $trip = Trip::findOrFail($request->trip_id);
            $traveler = auth()->user();

            // Accept the shipment
            $shipment->accept($traveler, $trip);

            // Calculate payment amount based on weight * trip price_per_kg
            $shipment->payment_amount = $shipment->package_weight * $trip->price_per_kg;
            $shipment->save();

            // Reduce trip capacity
            $trip->available_capacity -= $shipment->package_weight;
            $trip->save();

            return response()->json([
                'message' => 'Shipment accepted successfully.',
                'data' => new ShipmentResource($shipment->load(['sender', 'traveler', 'trip'])),
            ]);
        });
    }

    /**
     * Confirm delivery of shipment.
     * 
     * POST /api/shipments/{id}/confirm-delivery
     * Requires: auth:sanctum, shipment.access
     */
    public function confirmDelivery(string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $shipment = Shipment::findOrFail($id);

            // Only sender or traveler can confirm delivery
            $user = auth()->user();
            if ($shipment->sender_id !== $user->id && $shipment->traveler_id !== $user->id) {
                return response()->json([
                    'message' => 'You do not have permission to confirm delivery for this shipment.',
                ], 403);
            }

            // Confirm delivery
            $shipment->confirmDelivery();

            // Payment release will be handled by PaymentObserver

            return response()->json([
                'message' => 'Delivery confirmed successfully.',
                'data' => new ShipmentResource($shipment->load(['sender', 'traveler', 'trip'])),
            ]);
        });
    }

    /**
     * Traveler rejects a shipment request.
     *
     * POST /api/shipments/{id}/reject
     * Requires: auth:sanctum
     */
    public function reject(string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $shipment = Shipment::findOrFail($id);
            $user = auth()->user();

            // Must be the traveler assigned to this shipment or the trip owner
            $authorized = false;
            if ($shipment->traveler_id === $user->id) {
                $authorized = true;
            } elseif ($shipment->trip_id && $shipment->trip->traveler_id === $user->id) {
                $authorized = true;
            }

            if (!$authorized) {
                return response()->json([
                    'message' => __('messages.shipment.reject_unauthorized'),
                ], 403);
            }

            if (!$shipment->canTransitionTo('cancelled')) {
                return response()->json([
                    'message' => __('messages.shipment.cannot_reject'),
                ], 422);
            }

            // Restore capacity if shipment was accepted
            if ($shipment->status === 'accepted' && $shipment->trip_id) {
                $trip = $shipment->trip;
                $trip->available_capacity += $shipment->package_weight;
                $trip->save();
            }

            $shipment->status = 'cancelled';
            $shipment->save();

            return response()->json([
                'message' => __('messages.shipment.rejected'),
                'data' => new ShipmentResource($shipment->load(['sender', 'traveler', 'trip'])),
            ]);
        });
    }

    /**
     * Resolve country/city names from IDs and populate text fields.
     */
    private function resolveLocationNames(array $data, string $prefix): array
    {
        $countryKey = "{$prefix}_country_id";
        $cityKey = "{$prefix}_city_id";

        if (isset($data[$countryKey])) {
            $country = Country::find($data[$countryKey]);
            if ($country) {
                $data["{$prefix}_country"] = $country->name_en;
            }
        }

        if (isset($data[$cityKey])) {
            $city = City::find($data[$cityKey]);
            if ($city) {
                $data["{$prefix}_city"] = $city->name_en;
            }
        }

        return $data;
    }
}
