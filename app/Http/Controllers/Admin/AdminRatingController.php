<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RemoveRatingRequest;
use App\Http\Resources\RatingResource;
use App\Services\Admin\AdminRatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRatingController extends Controller
{
    protected AdminRatingService $ratingService;

    public function __construct(AdminRatingService $ratingService)
    {
        $this->ratingService = $ratingService;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['rating', 'type', 'search']);
        $perPage = $request->input('per_page', 50);

        $ratings = $this->ratingService->getRatings($filters, $perPage);

        return response()->json([
            'data' => RatingResource::collection($ratings),
            'meta' => [
                'current_page' => $ratings->currentPage(),
                'last_page' => $ratings->lastPage(),
                'per_page' => $ratings->perPage(),
                'total' => $ratings->total(),
            ],
        ], 200);
    }

    public function show(int $id): JsonResponse
    {
        $rating = $this->ratingService->getRatingDetails($id);

        return response()->json(['data' => new RatingResource($rating)], 200);
    }

    public function destroy(RemoveRatingRequest $request, int $id): JsonResponse
    {
        $result = $this->ratingService->removeRating($id, $request->reason, $request->user());

        return response()->json([
            'message' => 'Rating removed successfully',
            'new_average_rating' => $result['new_average_rating'],
        ], 200);
    }

    public function statistics(): JsonResponse
    {
        $statistics = $this->ratingService->getRatingStatistics();

        return response()->json(['data' => $statistics], 200);
    }
}
