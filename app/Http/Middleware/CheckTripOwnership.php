<?php

namespace App\Http\Middleware;

use App\Models\Trip;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CheckTripOwnership - Verify authenticated user is the trip owner
 * 
 * Returns 403 Forbidden if the user is not the owner of the trip.
 * 
 * Validates Requirements: 3.15
 */
class CheckTripOwnership
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $tripId = $request->route('id');

        if (!$tripId) {
            return response()->json([
                'message' => 'Trip ID is required'
            ], 400);
        }

        $trip = Trip::find($tripId);

        if (!$trip) {
            return response()->json([
                'message' => 'Trip not found'
            ], 404);
        }

        if ($trip->traveler_id !== $user->id) {
            return response()->json([
                'message' => 'Forbidden. You are not the owner of this trip.'
            ], 403);
        }

        return $next($request);
    }
}
