<?php

namespace App\Http\Controllers;

use App\Models\ShipmentRequest;
use App\Models\ShipmentBid;
use App\Http\Resources\ShipmentRequestResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ShipmentRequestController extends Controller
{
    /**
     * Display a listing of shipment requests (public - for travelers)
     */
    public function index(Request $request): JsonResponse
    {
        $query = ShipmentRequest::with([
            'sender:id,name,avatar',
            'pickupCountry',
            'pickupCity',
            'deliveryCountry',
            'deliveryCity'
        ])
        ->withCount(['bids as bids_count' => function($q) {
            $q->where('status', 'pending');
        }])
        ->where('verification_status', 'verified')
        ->open();

        // Filters
        if ($request->pickup_country) {
            $query->where('pickup_country_id', $request->pickup_country);
        }
        if ($request->delivery_country) {
            $query->where('delivery_country_id', $request->delivery_country);
        }
        if ($request->max_weight) {
            $query->where('weight', '<=', $request->max_weight);
        }
        if ($request->min_budget) {
            $query->where('max_budget', '>=', $request->min_budget);
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => ShipmentRequestResource::collection($requests->items()),
            'pagination' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ]
        ]);
    }

    /**
     * Store a newly created shipment request
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'weight' => 'required|numeric|min:0.1|max:50',
            'length' => 'nullable|numeric|min:1',
            'width' => 'nullable|numeric|min:1',
            'height' => 'nullable|numeric|min:1',
            'declared_value' => 'required|numeric|min:0',
            'package_type' => 'required|string|max:100',
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'pickup_country_id' => 'required|exists:countries,id',
            'pickup_city_id' => 'required|exists:cities,id',
            'pickup_address' => 'required|string',
            'delivery_country_id' => 'required|exists:countries,id',
            'delivery_city_id' => 'required|exists:cities,id',
            'delivery_address' => 'required|string',
            'max_budget' => 'nullable|numeric|min:0',
            'currency_code' => 'required|string|size:3',
            'needed_by' => 'nullable|date|after:now',
            'photo_urls' => 'nullable|array',
            'photo_urls.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $shipmentRequest = ShipmentRequest::create([
            'sender_id' => Auth::id(),
            ...$validator->validated()
        ]);

        $shipmentRequest->load([
            'sender:id,name,avatar',
            'pickupCountry:id,name_en,name_fr',
            'pickupCity:id,name_en,name_fr,country_id',
            'deliveryCountry:id,name_en,name_fr',
            'deliveryCity:id,name_en,name_fr,country_id'
        ]);

        return response()->json([
            'message' => 'Annonce d\'expédition créée avec succès',
            'data' => ShipmentRequestResource::make($shipmentRequest)
        ], 201);
    }

    /**
     * Display the specified shipment request
     */
    public function show(string $id): JsonResponse
    {
        $shipmentRequest = ShipmentRequest::with([
            'sender:id,name,avatar,rating,completed_deliveries',
            'pickupCountry:id,name_en,name_fr',
            'pickupCity:id,name_en,name_fr,country_id',
            'deliveryCountry:id,name_en,name_fr',
            'deliveryCity:id,name_en,name_fr,country_id',
            'bids' => function($q) {
                $q->with('traveler:id,name,avatar,rating,completed_deliveries')
                  ->orderBy('proposed_price', 'asc');
            }
        ])->findOrFail($id);

        return response()->json(['data' => ShipmentRequestResource::make($shipmentRequest)]);
    }

    /**
     * Get user's own shipment requests
     */
    public function myRequests(): JsonResponse
    {
        $requests = ShipmentRequest::with([
            'pickupCountry:id,name_en,name_fr',
            'pickupCity:id,name_en,name_fr,country_id',
            'deliveryCountry:id,name_en,name_fr',
            'deliveryCity:id,name_en,name_fr,country_id',
            'assignedTraveler:id,name,avatar'
        ])
        ->withCount(['bids as bids_count' => function($q) {
            $q->where('status', 'pending');
        }])
        ->where('sender_id', Auth::id())
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        return response()->json([
            'data' => ShipmentRequestResource::collection($requests->items()),
            'pagination' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ]
        ]);
    }

    /**
     * Update the specified shipment request
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $shipmentRequest = ShipmentRequest::where('sender_id', Auth::id())
                                         ->findOrFail($id);

        if ($shipmentRequest->status !== 'open') {
            return response()->json([
                'message' => 'Cette annonce ne peut plus être modifiée'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'max_budget' => 'sometimes|nullable|numeric|min:0',
            'needed_by' => 'sometimes|nullable|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $shipmentRequest->update($validator->validated());

        return response()->json([
            'message' => 'Annonce mise à jour avec succès',
            'data' => ShipmentRequestResource::make($shipmentRequest)
        ]);
    }

    /**
     * Remove the specified shipment request
     */
    public function destroy(string $id): JsonResponse
    {
        $shipmentRequest = ShipmentRequest::where('sender_id', Auth::id())
                                         ->findOrFail($id);

        if ($shipmentRequest->status !== 'open') {
            return response()->json([
                'message' => 'Cette annonce ne peut plus être supprimée'
            ], 422);
        }

        $shipmentRequest->delete();

        return response()->json([
            'message' => 'Annonce supprimée avec succès'
        ]);
    }
}