<?php

namespace App\Http\Controllers;

use App\Models\ShipmentRequest;
use App\Models\ShipmentBid;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ShipmentBidController extends Controller
{
    /**
     * Store a new bid on a shipment request
     */
    public function store(Request $request, string $shipmentRequestId): JsonResponse
    {
        $shipmentRequest = ShipmentRequest::findOrFail($shipmentRequestId);

        if (!$shipmentRequest->canReceiveBids()) {
            return response()->json([
                'message' => 'Cette annonce n\'accepte plus de soumissions'
            ], 422);
        }

        if ($shipmentRequest->sender_id === Auth::id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas soumissionner sur votre propre annonce'
            ], 422);
        }

        // Check if user already bid
        $existingBid = ShipmentBid::where('shipment_request_id', $shipmentRequestId)
                                 ->where('traveler_id', Auth::id())
                                 ->first();

        if ($existingBid) {
            return response()->json([
                'message' => 'Vous avez déjà soumissionné sur cette annonce'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'proposed_price' => 'required|numeric|min:0',
            'currency_code' => 'required|string|size:3',
            'message' => 'nullable|string|max:500',
            'trip_id' => 'nullable|exists:trips,id',
            'proposed_pickup_date' => 'required|date|after:now',
            'proposed_delivery_date' => 'required|date|after:proposed_pickup_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $bid = ShipmentBid::create([
            'shipment_request_id' => $shipmentRequestId,
            'traveler_id' => Auth::id(),
            ...$validator->validated()
        ]);

        $bid->load('traveler:id,name,avatar,rating,completed_deliveries');

        // Déclencher l'événement de notification
        event(new \App\Events\ShipmentBidSubmitted($bid));

        return response()->json([
            'message' => 'Soumission envoyée avec succès',
            'data' => $bid
        ], 201);
    }

    /**
     * Get bids for a shipment request (for the sender)
     */
    public function index(string $shipmentRequestId): JsonResponse
    {
        $shipmentRequest = ShipmentRequest::where('sender_id', Auth::id())
                                         ->findOrFail($shipmentRequestId);

        $bids = ShipmentBid::with([
            'traveler:id,name,avatar,rating,completed_deliveries',
            'trip:id,departure_city,arrival_city,departure_date'
        ])
        ->where('shipment_request_id', $shipmentRequestId)
        ->orderBy('proposed_price', 'asc')
        ->get();

        return response()->json(['data' => $bids]);
    }

    /**
     * Accept a bid
     */
    public function accept(string $shipmentRequestId, string $bidId): JsonResponse
    {
        $shipmentRequest = ShipmentRequest::where('sender_id', Auth::id())
                                         ->findOrFail($shipmentRequestId);

        $bid = ShipmentBid::where('shipment_request_id', $shipmentRequestId)
                         ->findOrFail($bidId);

        if (!$bid->accept()) {
            return response()->json([
                'message' => 'Impossible d\'accepter cette soumission'
            ], 422);
        }

        // Déclencher l'événement de notification
        event(new \App\Events\ShipmentBidAccepted($bid));

        return response()->json([
            'message' => 'Soumission acceptée avec succès',
            'data' => $bid->fresh(['traveler', 'shipmentRequest'])
        ]);
    }

    /**
     * Reject a bid
     */
    public function reject(string $shipmentRequestId, string $bidId): JsonResponse
    {
        $shipmentRequest = ShipmentRequest::where('sender_id', Auth::id())
                                         ->findOrFail($shipmentRequestId);

        $bid = ShipmentBid::where('shipment_request_id', $shipmentRequestId)
                         ->findOrFail($bidId);

        if ($bid->status !== 'pending') {
            return response()->json([
                'message' => 'Cette soumission ne peut plus être rejetée'
            ], 422);
        }

        $bid->update([
            'status' => 'rejected',
            'responded_at' => now(),
        ]);

        // Déclencher l'événement de notification
        event(new \App\Events\ShipmentBidRejected($bid));

        return response()->json([
            'message' => 'Soumission rejetée',
            'data' => $bid->fresh(['traveler', 'shipmentRequest'])
        ]);
    }

    /**
     * Get user's bids
     */
    public function myBids(): JsonResponse
    {
        $bids = ShipmentBid::with([
            'shipmentRequest' => function($q) {
                $q->with(['pickupCountry:id,name_en,name_fr', 'deliveryCountry:id,name_en,name_fr']);
            }
        ])
        ->where('traveler_id', Auth::id())
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        return response()->json([
            'data' => $bids->items(),
            'pagination' => [
                'current_page' => $bids->currentPage(),
                'last_page' => $bids->lastPage(),
                'per_page' => $bids->perPage(),
                'total' => $bids->total(),
            ]
        ]);
    }

    /**
     * Withdraw a bid
     */
    public function withdraw(string $bidId): JsonResponse
    {
        $bid = ShipmentBid::where('traveler_id', Auth::id())
                         ->findOrFail($bidId);

        if ($bid->status !== 'pending') {
            return response()->json([
                'message' => 'Cette soumission ne peut plus être retirée'
            ], 422);
        }

        $bid->update(['status' => 'withdrawn']);

        return response()->json([
            'message' => 'Soumission retirée avec succès'
        ]);
    }
}