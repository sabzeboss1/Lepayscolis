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

            // Calculate payment amount in trip's currency
            $packageWeight = $data['package_weight'];
            $paymentAmountInTripCurrency = $packageWeight * $trip->price_per_kg;
            
            // Get trip currency (defaults to platform default if not set)
            $tripCurrency = $trip->currency_code ?? \App\Models\PlatformSetting::getDefaultCurrency();

            // Get sender's wallet
            $wallet = $user->wallet;
            if (!$wallet) {
                return response()->json([
                    'message' => 'Wallet not found. Please contact support.',
                ], 500);
            }

            // Get sender's wallet currency
            $walletCurrency = $wallet->currency_code
                ?? $user->currency_code
                ?? \App\Models\PlatformSetting::getDefaultCurrency();

            // Convert payment amount to sender's wallet currency if needed
            $walletService = app(\App\Services\WalletService::class);
            $currencyService = app(\App\Services\CurrencyService::class);
            
            $paymentAmountInWalletCurrency = $paymentAmountInTripCurrency;
            $exchangeRate = null;
            
            if ($tripCurrency !== $walletCurrency) {
                $conversion = $currencyService->convert(
                    $paymentAmountInTripCurrency,
                    $tripCurrency,
                    $walletCurrency
                );
                $paymentAmountInWalletCurrency = $conversion['converted_amount'];
                $exchangeRate = $conversion['exchange_rate'];
            }

            // Check available balance in wallet currency
            $availableBalance = $walletService->getAvailableBalance($wallet);

            if ($availableBalance < $paymentAmountInWalletCurrency) {
                return response()->json([
                    'message' => 'Insufficient balance. Please recharge your wallet.',
                    'required_amount' => number_format($paymentAmountInWalletCurrency, 2),
                    'required_currency' => $walletCurrency,
                    'available_balance' => number_format($availableBalance, 2),
                    'shortfall' => number_format($paymentAmountInWalletCurrency - $availableBalance, 2),
                ], 422);
            }

            // Create shipment with validated data
            $shipment = new Shipment($data);
            $shipment->sender_id = $user->id;
            $shipment->status = 'pending';
            $shipment->payment_status = 'escrowed';
            // Store the payment amount in the trip's currency (original amount)
            $shipment->payment_amount = $paymentAmountInTripCurrency;
            $shipment->currency_code = $tripCurrency;

            $shipment->save();
            
            // Hold funds in wallet (using converted amount in wallet currency)
            try {
                $walletService->hold(
                    $wallet,
                    $paymentAmountInWalletCurrency,
                    "Funds held for shipment #{$shipment->id}",
                    'shipment',
                    $shipment->id,
                    $tripCurrency !== $walletCurrency ? $paymentAmountInTripCurrency : null,
                    $tripCurrency !== $walletCurrency ? $tripCurrency : null,
                    $exchangeRate
                );
            } catch (\Exception $e) {
                // If hold fails, delete the shipment
                $shipment->delete();
                
                return response()->json([
                    'message' => 'Failed to hold funds. Please try again.',
                    ...(config('app.debug') ? ['debug' => $e->getMessage()] : []),
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
        $shipment = Shipment::with(['sender', 'traveler', 'trip.traveler', 'pickupCountry', 'pickupCity', 'deliveryCountry', 'deliveryCity', 'payment'])
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
     * Get shipments pending for traveler's trips.
     * Returns shipments that are pending and assigned to the traveler's trips.
     * 
     * GET /api/shipments/pending-for-me
     * Requires: auth:sanctum
     */
    public function pendingForMe(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        // Get all trip IDs owned by the current user
        $tripIds = Trip::where('traveler_id', $user->id)->pluck('id');
        
        // Get shipments that are pending and assigned to these trips
        $query = Shipment::with(['sender', 'trip'])
            ->where('status', 'pending')
            ->whereIn('trip_id', $tripIds);

        // Paginate results
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
            $shipment = Shipment::with('sender.wallet')->findOrFail($id);

            // Restore trip capacity if transitioning from accepted to cancelled
            if ($request->status === 'cancelled' && $shipment->status === 'accepted' && $shipment->trip_id) {
                $trip = $shipment->trip;
                $trip->available_capacity += $shipment->package_weight;
                $trip->save();
            }

            // Release held funds when shipment is cancelled
            if ($request->status === 'cancelled' && $shipment->payment_status === 'escrowed' && $shipment->sender && $shipment->sender->wallet) {
                $walletService = app(\App\Services\WalletService::class);
                $wallet = $shipment->sender->wallet;

                // Use the original hold transaction amount to avoid exchange rate drift
                // between creation and cancellation causing "Insufficient held balance" errors
                $holdTransaction = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)
                    ->where('reference_type', 'shipment')
                    ->where('reference_id', $shipment->id)
                    ->where('type', 'hold')
                    ->first();

                if (!$holdTransaction) {
                    return response()->json([
                        'message' => 'Impossible de retrouver la transaction de blocage des fonds. Contactez le support.',
                    ], 422);
                }

                $walletService->cancelHold(
                    $wallet,
                    $holdTransaction->amount,
                    "Fonds libérés suite à l'annulation de l'expédition #{$shipment->id}",
                    'shipment',
                    $shipment->id
                );

                $shipment->payment_status = 'refunded';
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
     * WITH CURRENCY CONVERSION: Converts payment to traveler's wallet currency
     */
    public function confirmDelivery(string $id): JsonResponse
    {
        try {
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
            
            // Update completed deliveries count for both sender and traveler
            if ($shipment->sender) {
                $shipment->sender->increment('completed_deliveries');
                $shipment->sender->updateRecommendedStatus();
            }
            if ($shipment->traveler) {
                $shipment->traveler->increment('completed_deliveries');
                $shipment->traveler->updateRecommendedStatus();
            }
            
            // Process wallet transactions with currency conversion
            $walletService = app(\App\Services\WalletService::class);
            $currencyService = app(\App\Services\CurrencyService::class);

            // 1. Debit sender's wallet - use original hold amount (already converted to wallet currency)
            $senderWallet = $shipment->sender->wallet->fresh();
            $holdTransaction = \App\Models\WalletTransaction::where('wallet_id', $senderWallet->id)
                ->where('reference_type', 'shipment')
                ->where('reference_id', $shipment->id)
                ->where('type', 'hold')
                ->first();

            if ($holdTransaction && $senderWallet->held_balance >= $holdTransaction->amount) {
                // Release the exact held amount (in wallet currency)
                $walletService->releaseAndDebit(
                    $senderWallet,
                    $holdTransaction->amount,
                    "Payment for shipment #{$shipment->id} - Delivered",
                    'shipment',
                    $shipment->id
                );
            } else {
                // Fallback: convert payment_amount to wallet currency before debiting
                $shipmentCurrency = $shipment->currency_code
                    ?? $senderWallet->currency_code
                    ?? \App\Models\PlatformSetting::getDefaultCurrency();

                $debitAmount = $shipment->payment_amount;
                if ($shipmentCurrency !== $senderWallet->currency_code) {
                    $conversion = $currencyService->convert(
                        $shipment->payment_amount,
                        $shipmentCurrency,
                        $senderWallet->currency_code
                    );
                    $debitAmount = $conversion['converted_amount'];
                }

                $walletService->debit(
                    $senderWallet,
                    $debitAmount,
                    "Payment for shipment #{$shipment->id} - Delivered",
                    'shipment',
                    $shipment->id
                );
            }

            // 2. Calculate platform fee and traveler amount from Payment or PlatformSetting
            $payment = $shipment->payment;
            if ($payment && $payment->traveler_amount > 0) {
                $travelerAmount = (float) $payment->traveler_amount;
            } else {
                $fees = \App\Models\PlatformSetting::calculateFees($shipment->payment_amount);
                $travelerAmount = $fees['traveler_receives'];
            }

            // 3. Get currencies - shipment currency falls back to sender's wallet currency
            //    (the amount was debited in the sender's currency)
            $senderCurrency = $shipment->sender->wallet->currency_code
                ?? $shipment->sender->currency_code
                ?? \App\Models\PlatformSetting::getDefaultCurrency();
            $shipmentCurrency = $shipment->currency_code ?? $senderCurrency;
            $travelerCurrency = $shipment->traveler->wallet->currency_code
                ?? $shipment->traveler->currency_code
                ?? \App\Models\PlatformSetting::getDefaultCurrency();

            // 4. Convert amount to traveler's wallet currency if needed
            $convertedAmount = $travelerAmount;
            $exchangeRate = null;

            if ($shipmentCurrency !== $travelerCurrency) {
                $conversion = $currencyService->convert(
                    $travelerAmount,
                    $shipmentCurrency,
                    $travelerCurrency
                );
                $convertedAmount = $conversion['converted_amount'];
                $exchangeRate = $conversion['exchange_rate'];
            }

            // 5. Credit traveler's wallet
            $walletService->credit(
                $shipment->traveler->wallet,
                $convertedAmount,
                "Payment received for shipment #{$shipment->id}",
                'shipment',
                $shipment->id,
                $travelerAmount,
                $shipmentCurrency,
                $exchangeRate
            );

            // 6. Update shipment payment status
            $shipment->update(['payment_status' => 'released']);

            return response()->json([
                'message' => 'Delivery confirmed successfully. Payment has been processed.',
                'data' => new ShipmentResource($shipment->load(['sender', 'traveler', 'trip'])),
            ]);
        });
        } catch (\Exception $e) {
            \Log::error("Delivery confirmation failed for shipment #{$id}", [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Payment processing failed. No changes were made. Please contact support.',
                ...(config('app.debug') ? ['debug' => $e->getMessage()] : []),
            ], 500);
        }
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
            $shipment = Shipment::with('sender.wallet')->findOrFail($id);
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

            // Release held funds when shipment is rejected
            if ($shipment->payment_status === 'escrowed' && $shipment->sender && $shipment->sender->wallet) {
                $walletService = app(\App\Services\WalletService::class);
                $wallet = $shipment->sender->wallet;

                // Use the original hold transaction amount to avoid exchange rate drift
                $holdTransaction = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)
                    ->where('reference_type', 'shipment')
                    ->where('reference_id', $shipment->id)
                    ->where('type', 'hold')
                    ->first();

                if ($holdTransaction) {
                    $walletService->cancelHold(
                        $wallet,
                        $holdTransaction->amount,
                        "Fonds libérés suite au refus de l'expédition #{$shipment->id}",
                        'shipment',
                        $shipment->id
                    );
                    $shipment->payment_status = 'refunded';
                } else {
                    \Log::warning("Hold transaction not found for rejected shipment #{$shipment->id}");
                }
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
