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
     * 
     * NEW FLOW: Blocks funds in sender's wallet before creating shipment
     */
    public function store(CreateShipmentRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = auth()->user();
            $data = $request->validated();

            // Auto-populate text fields from country/city IDs
            $data = $this->resolveLocationNames($data, 'pickup');
            $data = $this->resolveLocationNames($data, 'delivery');

            // Get trip to calculate payment amount
            $tripId = $data['trip_id'] ?? null;
            if (!$tripId) {
                return response()->json([
                    'message' => 'Trip ID is required to calculate payment amount.',
                ], 422);
            }

            $trip = Trip::findOrFail($tripId);

            // Calculate payment amount
            $packageWeight = $data['package_weight'];
            $paymentAmount = $packageWeight * $trip->price_per_kg;

            // Get sender's wallet
            $wallet = $user->wallet;
            if (!$wallet) {
                return response()->json([
                    'message' => 'Wallet not found. Please contact support.',
                ], 500);
            }

            // Check available balance (balance - held_balance)
            $walletService = app(\App\Services\WalletService::class);
            $availableBalance = $walletService->getAvailableBalance($wallet);

            if ($availableBalance < $paymentAmount) {
                return response()->json([
                    'message' => 'Insufficient balance. Please recharge your wallet.',
                    'required_amount' => number_format($paymentAmount, 2),
                    'available_balance' => number_format($availableBalance, 2),
                    'shortfall' => number_format($paymentAmount - $availableBalance, 2),
                ], 422);
            }

            // Create shipment with validated data
            $shipment = new Shipment($data);
            $shipment->sender_id = $user->id;
            $shipment->status = 'pending';
            $shipment->payment_status = 'escrowed';
            $shipment->payment_amount = $paymentAmount;

            $shipment->save();
            
            // Hold funds in wallet
            try {
                $walletService->hold(
                    $wallet,
                    $paymentAmount,
                    "Funds held for shipment #{$shipment->id}",
                    'shipment',
                    $shipment->id
                );
            } catch (\Exception $e) {
                // If hold fails, delete the shipment
                $shipment->delete();
                
                return response()->json([
                    'message' => 'Failed to hold funds. Please try again.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return response()->json([
                'message' => 'Shipment created successfully. Funds have been held in your wallet.',
                'data' => new ShipmentResource($shipment->load('trip')),
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
     * List available shipments for travelers (pending shipments without trip).
     *
     * GET /api/shipments/available
     * Requires: auth:sanctum
     */
    public function available(Request $request): JsonResponse
    {
        $query = Shipment::with(['sender'])
            ->where('status', 'pending')
            ->whereNull('trip_id')
            ->whereNull('traveler_id');

        // Filter by pickup country
        if ($request->has('pickup_country')) {
            $query->where('pickup_country', 'like', '%' . $request->pickup_country . '%');
        }

        // Filter by delivery country
        if ($request->has('delivery_country')) {
            $query->where('delivery_country', 'like', '%' . $request->delivery_country . '%');
        }

        // Filter by pickup city
        if ($request->has('pickup_city')) {
            $query->where('pickup_city', 'like', '%' . $request->pickup_city . '%');
        }

        // Filter by delivery city
        if ($request->has('delivery_city')) {
            $query->where('delivery_city', 'like', '%' . $request->delivery_city . '%');
        }

        // Filter by max weight
        if ($request->has('max_weight')) {
            $query->where('package_weight', '<=', $request->max_weight);
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
     * 
     * NEW FLOW: When receiver confirms, funds are debited from sender and credited to traveler
     */
    public function confirmDelivery(string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $shipment = Shipment::with(['sender.wallet', 'traveler.wallet'])->findOrFail($id);

            // Only sender or traveler can confirm delivery
            $user = auth()->user();
            if ($shipment->sender_id !== $user->id && $shipment->traveler_id !== $user->id) {
                return response()->json([
                    'message' => 'You do not have permission to confirm delivery for this shipment.',
                ], 403);
            }

            // Confirm delivery
            $shipment->confirmDelivery();
            
            // Process wallet transactions
            $walletService = app(\App\Services\WalletService::class);
            
            try {
                // 1. Release held funds and debit sender's wallet
                $walletService->releaseAndDebit(
                    $shipment->sender->wallet,
                    $shipment->payment_amount,
                    "Payment for shipment #{$shipment->id} - Delivered",
                    'shipment',
                    $shipment->id
                );
                
                // 2. Calculate platform fee (15%) and traveler amount (85%)
                $platformFee = $shipment->payment_amount * 0.15;
                $travelerAmount = $shipment->payment_amount * 0.85;
                
                // 3. Credit traveler's wallet (85% of payment)
                $walletService->credit(
                    $shipment->traveler->wallet,
                    $travelerAmount,
                    "Payment received for shipment #{$shipment->id}",
                    'shipment',
                    $shipment->id
                );
                
                // 4. Update shipment payment status
                $shipment->update(['payment_status' => 'released']);
                
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Delivery confirmed but payment processing failed. Please contact support.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return response()->json([
                'message' => 'Delivery confirmed successfully. Payment has been processed.',
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
