<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Shipment;
use App\Models\ShipmentRequest;
use App\Models\ShipmentBid;
use App\Models\User;
use App\Services\WalletService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminRoutingController extends Controller
{
    protected $walletService;
    protected $notificationService;

    public function __construct(WalletService $walletService, NotificationService $notificationService)
    {
        $this->walletService = $walletService;
        $this->notificationService = $notificationService;
    }

    /**
     * Assign a pending shipment to a specific trip
     * 
     * POST /api/admin/routing/assign-shipment
     */
    public function assignShipmentToTrip(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'trip_id' => 'required|exists:trips,id',
            'shipment_id' => 'required|exists:shipments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            $trip = Trip::with('traveler')->findOrFail($request->trip_id);
            $shipment = Shipment::with(['sender.wallet', 'sender'])->findOrFail($request->shipment_id);

            // Verify shipment is pending
            if ($shipment->status !== 'pending') {
                return response()->json([
                    'message' => 'Cette expédition n\'est plus en attente'
                ], 422);
            }

            // Verify trip has enough capacity
            if ($trip->available_capacity < $shipment->package_weight) {
                return response()->json([
                    'message' => 'Capacité insuffisante sur ce voyage'
                ], 422);
            }

            // Verify trip is active and verified
            if ($trip->status !== 'active' || $trip->verification_status !== 'verified') {
                return response()->json([
                    'message' => 'Ce voyage n\'est pas disponible pour assignation'
                ], 422);
            }

            // Calculate payment amount
            $paymentAmount = $shipment->package_weight * $trip->price_per_kg;

            // Check if sender has sufficient balance
            $senderWallet = $shipment->sender->wallet;
            if (!$senderWallet) {
                return response()->json([
                    'message' => 'Wallet de l\'expéditeur non trouvé'
                ], 500);
            }

            $availableBalance = $this->walletService->getAvailableBalance($senderWallet);
            if ($availableBalance < $paymentAmount) {
                return response()->json([
                    'message' => 'Solde insuffisant pour cette assignation',
                    'required_amount' => number_format($paymentAmount, 2),
                    'available_balance' => number_format($availableBalance, 2),
                ], 422);
            }

            // Assign shipment to trip
            $shipment->update([
                'trip_id' => $trip->id,
                'traveler_id' => $trip->traveler_id,
                'status' => 'accepted',
                'payment_amount' => $paymentAmount,
                'payment_status' => 'escrowed'
            ]);

            // Update trip capacity
            $trip->decrement('available_capacity', $shipment->package_weight);

            // Hold funds in sender's wallet
            try {
                $this->walletService->hold(
                    $senderWallet,
                    $paymentAmount,
                    "Funds held for shipment #{$shipment->id} (admin assignment)",
                    'shipment',
                    $shipment->id
                );
            } catch (\Exception $e) {
                // Rollback shipment changes if wallet operation fails
                $shipment->update([
                    'trip_id' => null,
                    'traveler_id' => null,
                    'status' => 'pending',
                    'payment_amount' => 0,
                    'payment_status' => 'pending'
                ]);
                $trip->increment('available_capacity', $shipment->package_weight);
                
                return response()->json([
                    'message' => 'Erreur lors du blocage des fonds: ' . $e->getMessage()
                ], 500);
            }

            // Send notifications
            try {
                // Notify traveler
                $this->notificationService->createNotification(
                    $trip->traveler,
                    'shipment_assigned',
                    'Nouvelle expédition assignée',
                    "Une expédition de {$shipment->package_weight}kg vous a été assignée par l'admin",
                    ['shipment_id' => $shipment->id]
                );

                // Notify sender
                $this->notificationService->createNotification(
                    $shipment->sender,
                    'shipment_assigned',
                    'Expédition assignée',
                    "Votre expédition a été assignée au voyageur {$trip->traveler->name}",
                    ['shipment_id' => $shipment->id]
                );
            } catch (\Exception $e) {
                // Log notification error but don't fail the assignment
                \Log::error('Failed to send routing notifications: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Expédition assignée avec succès',
                'data' => [
                    'shipment' => $shipment->fresh(['sender', 'traveler', 'trip']),
                    'trip' => $trip->fresh(['traveler'])
                ]
            ]);
        });
    }

    /**
     * Recommend a traveler for a shipment request by creating an admin bid
     * 
     * POST /api/admin/routing/recommend-traveler
     */
    public function recommendTravelerForRequest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'shipment_request_id' => 'required|exists:shipment_requests,id',
            'traveler_id' => 'required|exists:users,id',
            'trip_id' => 'required|exists:trips,id',
            'proposed_price' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            $shipmentRequest = ShipmentRequest::findOrFail($request->shipment_request_id);
            $trip = Trip::with('traveler')->findOrFail($request->trip_id);

            // Verify request is open and verified
            if ($shipmentRequest->status !== 'open' || $shipmentRequest->verification_status !== 'verified') {
                return response()->json([
                    'message' => 'Cette demande n\'accepte plus de soumissions'
                ], 422);
            }

            // Verify trip belongs to the specified traveler
            if ($trip->traveler_id !== $request->traveler_id) {
                return response()->json([
                    'message' => 'Ce voyage n\'appartient pas au voyageur spécifié'
                ], 422);
            }

            // Check if traveler already has a bid on this request
            $existingBid = ShipmentBid::where('shipment_request_id', $shipmentRequest->id)
                                   ->where('traveler_id', $request->traveler_id)
                                   ->first();

            if ($existingBid) {
                return response()->json([
                    'message' => 'Ce voyageur a déjà soumissionné sur cette demande'
                ], 422);
            }

            // Calculate proposed price (use provided price or trip's price_per_kg * weight)
            $proposedPrice = $request->proposed_price ?? ($trip->price_per_kg * $shipmentRequest->weight);

            // Ensure proposed price doesn't exceed max budget
            if ($shipmentRequest->max_budget > 0 && $proposedPrice > $shipmentRequest->max_budget) {
                $proposedPrice = $shipmentRequest->max_budget;
            }

            // Calculate proposed dates based on trip dates
            $proposedPickupDate = $trip->departure_date;
            $proposedDeliveryDate = $trip->arrival_date;

            // Create admin-recommended bid
            $bid = ShipmentBid::create([
                'shipment_request_id' => $shipmentRequest->id,
                'traveler_id' => $request->traveler_id,
                'trip_id' => $trip->id,
                'proposed_price' => $proposedPrice,
                'currency_code' => $shipmentRequest->currency_code,
                'message' => 'Recommandation administrative - Voyageur sélectionné par notre équipe pour sa fiabilité et compatibilité avec votre demande.',
                'proposed_pickup_date' => $proposedPickupDate,
                'proposed_delivery_date' => $proposedDeliveryDate,
                'status' => 'pending'
            ]);

            // Send notifications
            try {
                // Notify sender about the recommended bid
                $this->notificationService->createNotification(
                    $shipmentRequest->sender,
                    'admin_recommendation',
                    'Voyageur recommandé',
                    "Notre équipe vous recommande {$trip->traveler->name} pour votre demande d'expédition",
                    ['shipment_request_id' => $shipmentRequest->id, 'bid_id' => $bid->id]
                );

                // Notify traveler about the recommendation
                $this->notificationService->createNotification(
                    $trip->traveler,
                    'admin_recommendation',
                    'Recommandation administrative',
                    "Vous avez été recommandé pour une demande d'expédition: {$shipmentRequest->title}",
                    ['shipment_request_id' => $shipmentRequest->id, 'bid_id' => $bid->id]
                );
            } catch (\Exception $e) {
                // Log notification error but don't fail the recommendation
                \Log::error('Failed to send recommendation notifications: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Voyageur recommandé avec succès',
                'data' => [
                    'bid' => $bid->fresh(['traveler', 'shipmentRequest']),
                    'trip' => $trip
                ]
            ]);
        });
    }

    /**
     * Assign a pending shipment to a specific user (without requiring a trip)
     * 
     * POST /api/admin/routing/assign-shipment-to-user
     */
    public function assignShipmentToUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'shipment_id' => 'required|exists:shipments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            $user = User::findOrFail($request->user_id);
            $shipment = Shipment::with(['sender.wallet'])->findOrFail($request->shipment_id);

            // Verify shipment is pending
            if ($shipment->status !== 'pending') {
                return response()->json([
                    'message' => 'Cette expédition n\'est plus en attente'
                ], 422);
            }

            // Verify user is eligible (KYC approved, active)
            if ($user->kyc_status !== 'approved' || $user->role !== 'user') {
                return response()->json([
                    'message' => 'Cet utilisateur n\'est pas éligible pour recevoir des expéditions'
                ], 422);
            }

            // For direct user assignment, we'll use a default price or let admin specify
            $paymentAmount = $shipment->payment_amount ?: 50.00; // Default price if not set

            // Check if sender has sufficient balance
            $senderWallet = $shipment->sender->wallet;
            if (!$senderWallet) {
                return response()->json([
                    'message' => 'Wallet de l\'expéditeur non trouvé'
                ], 500);
            }

            $availableBalance = $this->walletService->getAvailableBalance($senderWallet);
            if ($availableBalance < $paymentAmount) {
                return response()->json([
                    'message' => 'Solde insuffisant pour cette assignation',
                    'required_amount' => number_format($paymentAmount, 2),
                    'available_balance' => number_format($availableBalance, 2),
                ], 422);
            }

            // Assign shipment to user
            $shipment->update([
                'traveler_id' => $user->id,
                'status' => 'accepted',
                'payment_amount' => $paymentAmount,
                'payment_status' => 'escrowed'
            ]);

            // Hold funds in sender's wallet
            try {
                $this->walletService->hold(
                    $senderWallet,
                    $paymentAmount,
                    "Funds held for shipment #{$shipment->id} (admin user assignment)",
                    'shipment',
                    $shipment->id
                );
            } catch (\Exception $e) {
                // Rollback shipment changes if wallet operation fails
                $shipment->update([
                    'traveler_id' => null,
                    'status' => 'pending',
                    'payment_amount' => 0,
                    'payment_status' => 'pending'
                ]);
                
                return response()->json([
                    'message' => 'Erreur lors du blocage des fonds: ' . $e->getMessage()
                ], 500);
            }

            // Send notifications
            try {
                // Notify user
                $this->notificationService->createNotification(
                    $user,
                    'shipment_assigned',
                    'Nouvelle expédition assignée',
                    "Une expédition de {$shipment->package_weight}kg vous a été assignée par l'admin",
                    ['shipment_id' => $shipment->id]
                );

                // Notify sender
                $this->notificationService->createNotification(
                    $shipment->sender,
                    'shipment_assigned',
                    'Expédition assignée',
                    "Votre expédition a été assignée à {$user->name}",
                    ['shipment_id' => $shipment->id]
                );
            } catch (\Exception $e) {
                // Log notification error but don't fail the assignment
                \Log::error('Failed to send user assignment notifications: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Expédition assignée avec succès à l\'utilisateur',
                'data' => [
                    'shipment' => $shipment->fresh(['sender', 'traveler']),
                    'user' => $user
                ]
            ]);
        });
    }

    /**
     * Recommend a user for a shipment request by creating an admin bid
     * 
     * POST /api/admin/routing/recommend-user
     */
    public function recommendUserForRequest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'shipment_request_id' => 'required|exists:shipment_requests,id',
            'user_id' => 'required|exists:users,id',
            'proposed_price' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            $shipmentRequest = ShipmentRequest::findOrFail($request->shipment_request_id);
            $user = User::findOrFail($request->user_id);

            // Verify request is open and verified
            if ($shipmentRequest->status !== 'open' || $shipmentRequest->verification_status !== 'verified') {
                return response()->json([
                    'message' => 'Cette demande n\'accepte plus de soumissions'
                ], 422);
            }

            // Verify user is eligible
            if ($user->kyc_status !== 'approved' || $user->role !== 'user') {
                return response()->json([
                    'message' => 'Cet utilisateur n\'est pas éligible'
                ], 422);
            }

            // Check if user already has a bid on this request
            $existingBid = ShipmentBid::where('shipment_request_id', $shipmentRequest->id)
                                   ->where('traveler_id', $user->id)
                                   ->first();

            if ($existingBid) {
                return response()->json([
                    'message' => 'Cet utilisateur a déjà soumissionné sur cette demande'
                ], 422);
            }

            // Calculate proposed price (use provided price or max budget)
            $proposedPrice = $request->proposed_price ?? $shipmentRequest->max_budget;

            // Ensure proposed price doesn't exceed max budget
            if ($shipmentRequest->max_budget > 0 && $proposedPrice > $shipmentRequest->max_budget) {
                $proposedPrice = $shipmentRequest->max_budget;
            }

            // Calculate proposed dates (default to near future)
            $proposedPickupDate = now()->addDays(2);
            $proposedDeliveryDate = now()->addDays(7);

            // Create admin-recommended bid
            $bid = ShipmentBid::create([
                'shipment_request_id' => $shipmentRequest->id,
                'traveler_id' => $user->id,
                'trip_id' => null, // No specific trip for user recommendation
                'proposed_price' => $proposedPrice,
                'currency_code' => $shipmentRequest->currency_code,
                'message' => 'Recommandation administrative - Utilisateur sélectionné par notre équipe pour sa fiabilité.',
                'proposed_pickup_date' => $proposedPickupDate,
                'proposed_delivery_date' => $proposedDeliveryDate,
                'status' => 'pending'
            ]);

            // Send notifications
            try {
                // Notify sender about the recommended bid
                $this->notificationService->createNotification(
                    $shipmentRequest->sender,
                    'admin_recommendation',
                    'Utilisateur recommandé',
                    "Notre équipe vous recommande {$user->name} pour votre demande d'expédition",
                    ['shipment_request_id' => $shipmentRequest->id, 'bid_id' => $bid->id]
                );

                // Notify user about the recommendation
                $this->notificationService->createNotification(
                    $user,
                    'admin_recommendation',
                    'Recommandation administrative',
                    "Vous avez été recommandé pour une demande d'expédition: {$shipmentRequest->title}",
                    ['shipment_request_id' => $shipmentRequest->id, 'bid_id' => $bid->id]
                );
            } catch (\Exception $e) {
                // Log notification error but don't fail the recommendation
                \Log::error('Failed to send user recommendation notifications: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Utilisateur recommandé avec succès',
                'data' => [
                    'bid' => $bid->fresh(['traveler', 'shipmentRequest']),
                    'user' => $user
                ]
            ]);
        });
    }
    public function getRoutingStats(): JsonResponse
    {
        $stats = [
            'available_trips' => Trip::where('status', 'active')
                                   ->where('verification_status', 'verified')
                                   ->where('available_capacity', '>', 0)
                                   ->count(),
            
            'pending_shipments' => Shipment::where('status', 'pending')
                                          ->whereNull('trip_id')
                                          ->count(),
            
            'open_requests' => ShipmentRequest::where('status', 'open')
                                            ->where('verification_status', 'verified')
                                            ->count(),
            
            'total_capacity' => Trip::where('status', 'active')
                                  ->where('verification_status', 'verified')
                                  ->sum('available_capacity'),
            
            'pending_weight' => Shipment::where('status', 'pending')
                                      ->whereNull('trip_id')
                                      ->sum('package_weight'),
            
            'requests_weight' => ShipmentRequest::where('status', 'open')
                                              ->where('verification_status', 'verified')
                                              ->sum('weight'),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Get compatibility suggestions for a specific item
     * 
     * POST /api/admin/routing/suggestions
     */
    public function getCompatibilitySuggestions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:shipment,request',
            'id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->type === 'shipment') {
            $shipment = Shipment::findOrFail($request->id);
            $compatibleTrips = $this->findCompatibleTripsForShipment($shipment);
            
            return response()->json([
                'data' => $compatibleTrips
            ]);
        } else {
            $shipmentRequest = ShipmentRequest::findOrFail($request->id);
            $compatibleTrips = $this->findCompatibleTripsForRequest($shipmentRequest);
            
            return response()->json([
                'data' => $compatibleTrips
            ]);
        }
    }

    private function findCompatibleTripsForShipment(Shipment $shipment)
    {
        return Trip::with('traveler')
            ->where('status', 'active')
            ->where('verification_status', 'verified')
            ->where('available_capacity', '>=', $shipment->package_weight)
            // OPTION B: Match on countries (flexible), prioritize city matches
            ->where('departure_country', $shipment->pickup_country)
            ->where('arrival_country', $shipment->delivery_country)
            // Order by: perfect city match first, then by date
            ->orderByRaw("
                CASE 
                    WHEN departure_city = ? AND arrival_city = ? THEN 1
                    ELSE 2
                END
            ", [$shipment->pickup_city, $shipment->delivery_city])
            ->orderBy('departure_date', 'asc')
            ->limit(20)  // Increased from 10 to 20 for more options
            ->get();
    }

    private function findCompatibleTripsForRequest(ShipmentRequest $request)
    {
        // Get city and country names for matching
        $pickupCity = $request->pickup_city ? $request->pickup_city->name : '';
        $pickupCountry = $request->pickup_country ? $request->pickup_country->name : '';
        $deliveryCity = $request->delivery_city ? $request->delivery_city->name : '';
        $deliveryCountry = $request->delivery_country ? $request->delivery_country->name : '';

        return Trip::with('traveler')
            ->where('status', 'active')
            ->where('verification_status', 'verified')
            ->where('available_capacity', '>=', $request->weight)
            // OPTION B: Match on countries (flexible), prioritize city matches
            ->where('departure_country', $pickupCountry)
            ->where('arrival_country', $deliveryCountry)
            // Order by: perfect city match first, then by date
            ->orderByRaw("
                CASE 
                    WHEN departure_city = ? AND arrival_city = ? THEN 1
                    ELSE 2
                END
            ", [$pickupCity, $deliveryCity])
            ->orderBy('departure_date', 'asc')
            ->limit(20)  // Increased from 10 to 20 for more options
            ->get();
    }
}