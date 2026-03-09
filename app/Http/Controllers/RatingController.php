<?php

namespace App\Http\Controllers;

use App\Http\Requests\Rating\SubmitRatingRequest;
use App\Http\Resources\RatingResource;
use App\Models\Rating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RatingController extends Controller
{
    /**
     * Submit a rating for a user after a shipment.
     */
    public function store(SubmitRatingRequest $request): JsonResponse
    {
        $rating = Rating::create([
            'from_user_id' => $request->user()->id,
            'to_user_id' => $request->to_user_id,
            'shipment_id' => $request->shipment_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json([
            'message' => 'Rating submitted successfully',
            'data' => new RatingResource($rating->load('fromUser', 'toUser', 'shipment')),
        ], 201);
    }

    /**
     * List ratings with optional filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Rating::with('fromUser', 'toUser', 'shipment');

        // Filter by user_id (ratings received by this user)
        if ($request->has('user_id')) {
            $query->where('to_user_id', $request->user_id);
        }

        // Filter by shipment_id
        if ($request->has('shipment_id')) {
            $query->where('shipment_id', $request->shipment_id);
        }

        // Order by most recent first
        $query->orderBy('created_at', 'desc');

        // Paginate results
        $perPage = $request->input('per_page', 15);
        $ratings = $query->paginate($perPage);

        return RatingResource::collection($ratings);
    }
}
