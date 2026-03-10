<?php

namespace App\Http\Middleware;

use App\Models\Shipment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CheckShipmentAccess Middleware
 * 
 * Verifies that the authenticated user is either the sender or traveler
 * of the shipment being accessed.
 * 
 * Returns 403 Forbidden if user is not authorized.
 * 
 * Validates Requirements: 4.17-4.18
 */
class CheckShipmentAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $shipmentId = $request->route('id');
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Try to find shipment
        $shipment = Shipment::find($shipmentId);

        if (!$shipment) {
            return response()->json([
                'message' => 'Shipment not found.',
            ], 404);
        }

        // Check if user is sender or traveler
        $isSender = $shipment->sender_id === $user->id;
        $isTraveler = $shipment->traveler_id !== null && $shipment->traveler_id === $user->id;
        
        if (!$isSender && !$isTraveler) {
            return response()->json([
                'message' => 'You do not have access to this shipment.',
            ], 403);
        }

        return $next($request);
    }
}
