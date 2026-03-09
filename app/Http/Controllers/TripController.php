<?php

namespace App\Http\Controllers;

use App\Http\Requests\Trip\CreateTripRequest;
use App\Http\Requests\Trip\SearchTripsRequest;
use App\Http\Requests\Trip\UpdateTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TripController - Handle trip CRUD operations
 * 
 * Endpoints:
 * - GET /api/trips: list trips with search filters
 * - POST /api/trips: create trip (requires auth + KYC)
 * - GET /api/trips/{id}: get trip details
 * - GET /api/trips/my: get authenticated user's trips
 * - PUT /api/trips/{id}: update trip (owner only)
 * - DELETE /api/trips/{id}: soft delete trip (owner only)
 * 
 * Validates Requirements: 3.1-3.16
 */
class TripController extends Controller
{
    public function __construct(
        private FileUploadService $fileUploadService
    ) {}

    /**
     * List trips with search filters and pagination
     * 
     * Filters:
     * - departure: partial match on departure_city
     * - arrival: partial match on arrival_city
     * - dateFrom: minimum departure_date
     * - dateTo: maximum departure_date
     * - minCapacity: minimum available_capacity
     * 
     * Validates Requirements: 3.8-3.11, 3.12, 3.16
     */
    public function index(SearchTripsRequest $request): JsonResponse
    {
        $query = Trip::query()
            ->with('traveler') // Eager load to prevent N+1 queries
            ->active();

        // Apply search filters
        if ($request->filled('departure')) {
            $query->where('departure_city', 'like', '%' . $request->departure . '%');
        }

        if ($request->filled('arrival')) {
            $query->where('arrival_city', 'like', '%' . $request->arrival . '%');
        }

        if ($request->filled('dateFrom')) {
            $query->where('departure_date', '>=', $request->dateFrom);
        }

        if ($request->filled('dateTo')) {
            $query->where('departure_date', '<=', $request->dateTo);
        }

        if ($request->filled('minCapacity')) {
            $query->where('available_capacity', '>=', $request->minCapacity);
        }

        // Order by departure date (upcoming first)
        $query->orderBy('departure_date', 'asc');

        // Paginate results (default 15 per page)
        $perPage = $request->input('per_page', 15);
        $trips = $query->paginate($perPage);

        return response()->json([
            'data' => TripResource::collection($trips->items()),
            'meta' => [
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
                'per_page' => $trips->perPage(),
                'total' => $trips->total(),
            ],
        ]);
    }

    /**
     * Create a new trip
     * 
     * Requires:
     * - Authentication (auth:sanctum middleware)
     * - KYC verification (kyc.verified middleware)
     * 
     * Validates Requirements: 3.1-3.7
     */
    public function store(CreateTripRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['traveler_id'] = $request->user()->id;
            $data['status'] = 'active';

            // Upload travel proof if provided
            if ($request->hasFile('travel_proof')) {
                try {
                    $travelProofUrl = $this->fileUploadService->uploadTravelProof(
                        $request->file('travel_proof'),
                        'temp-' . time() // Temporary ID, will be replaced after trip creation
                    );
                    $data['travel_proof_url'] = $travelProofUrl;
                } catch (\Exception $e) {
                    Log::error('Failed to upload travel proof', [
                        'user_id' => $request->user()->id,
                        'error' => $e->getMessage()
                    ]);
                    
                    DB::rollBack();
                    
                    return response()->json([
                        'message' => 'Failed to upload travel proof',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            $trip = Trip::create($data);

            // If travel proof was uploaded with temp ID, update it with actual trip ID
            if (isset($data['travel_proof_url']) && str_contains($data['travel_proof_url'], 'temp-')) {
                // Note: In production, you might want to move the file to the correct path
                // For now, we'll keep the temp path as it's still unique and accessible
            }

            DB::commit();

            // Load traveler relationship
            $trip->load('traveler');

            Log::info('Trip created successfully', [
                'trip_id' => $trip->id,
                'traveler_id' => $trip->traveler_id
            ]);

            return response()->json([
                'message' => 'Trip created successfully',
                'data' => new TripResource($trip)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to create trip', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create trip',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trip details with traveler data
     * 
     * Validates Requirements: 3.12
     */
    public function show(string $id): JsonResponse
    {
        $trip = Trip::with('traveler')->find($id);

        if (!$trip) {
            return response()->json([
                'message' => 'Trip not found'
            ], 404);
        }

        return response()->json([
            'data' => new TripResource($trip)
        ]);
    }

    /**
     * Get authenticated user's trips
     * 
     * Validates Requirements: 3.13
     */
    public function myTrips(Request $request): JsonResponse
    {
        $trips = Trip::query()
            ->with('traveler')
            ->where('traveler_id', $request->user()->id)
            ->orderBy('departure_date', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => TripResource::collection($trips->items()),
            'meta' => [
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
                'per_page' => $trips->perPage(),
                'total' => $trips->total(),
            ],
        ]);
    }

    /**
     * Update trip (owner only)
     * 
     * Validates Requirements: 3.14, 3.15
     */
    public function update(UpdateTripRequest $request, string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $trip = Trip::find($id);

            if (!$trip) {
                return response()->json([
                    'message' => 'Trip not found'
                ], 404);
            }

            $data = $request->validated();

            // Upload new travel proof if provided
            if ($request->hasFile('travel_proof')) {
                try {
                    // Delete old travel proof if exists
                    if ($trip->travel_proof_url) {
                        $this->fileUploadService->deleteFile($trip->travel_proof_url);
                    }

                    $travelProofUrl = $this->fileUploadService->uploadTravelProof(
                        $request->file('travel_proof'),
                        $trip->id
                    );
                    $data['travel_proof_url'] = $travelProofUrl;
                } catch (\Exception $e) {
                    Log::error('Failed to upload travel proof during update', [
                        'trip_id' => $trip->id,
                        'error' => $e->getMessage()
                    ]);
                    
                    DB::rollBack();
                    
                    return response()->json([
                        'message' => 'Failed to upload travel proof',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            $trip->update($data);

            DB::commit();

            // Reload traveler relationship
            $trip->load('traveler');

            Log::info('Trip updated successfully', [
                'trip_id' => $trip->id,
                'updated_fields' => array_keys($data)
            ]);

            return response()->json([
                'message' => 'Trip updated successfully',
                'data' => new TripResource($trip)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update trip', [
                'trip_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update trip',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete trip (owner only)
     * 
     * Validates Requirements: 3.15
     */
    public function destroy(string $id): JsonResponse
    {
        $trip = Trip::find($id);

        if (!$trip) {
            return response()->json([
                'message' => 'Trip not found'
            ], 404);
        }

        $trip->delete();

        Log::info('Trip deleted successfully', [
            'trip_id' => $trip->id,
            'traveler_id' => $trip->traveler_id
        ]);

        return response()->json([
            'message' => 'Trip deleted successfully'
        ]);
    }
}
