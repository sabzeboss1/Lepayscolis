<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Rating;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserStatsController extends Controller
{
    /**
     * Get user statistics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get trips count
        $totalTrips = Trip::where('traveler_id', $user->id)->count();
        
        // Get shipments count (as sender or as traveler who delivered)
        $totalShipments = Shipment::where(function($query) use ($user) {
            $query->where('sender_id', $user->id)
                  ->orWhereHas('trip', function($q) use ($user) {
                      $q->where('traveler_id', $user->id);
                  });
        })->where('status', 'delivered')->count();
        
        // Get wallet balance and total earnings
        $wallet = Wallet::where('user_id', $user->id)->first();
        $totalEarnings = $wallet ? $wallet->total_earned : 0;
        $currentBalance = $wallet ? $wallet->balance : 0;
        
        // Calculate success rate (delivered shipments / total accepted shipments)
        $acceptedShipments = Shipment::whereHas('trip', function($q) use ($user) {
            $q->where('traveler_id', $user->id);
        })->whereIn('status', ['accepted', 'in_transit', 'delivered'])->count();
        
        $deliveredShipments = Shipment::whereHas('trip', function($q) use ($user) {
            $q->where('traveler_id', $user->id);
        })->where('status', 'delivered')->count();
        
        $successRate = $acceptedShipments > 0 
            ? round(($deliveredShipments / $acceptedShipments) * 100, 1) 
            : 100;
        
        // Calculate average response time (mock for now - would need message timestamps)
        $responseTime = '< 2h';
        
        // Get earnings this month
        $earningsThisMonth = WalletTransaction::where('wallet_id', $wallet ? $wallet->id : null)
            ->where('type', 'credit')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');
        
        // Get pending earnings (payments in escrow)
        $pendingEarnings = Payment::whereHas('shipment.trip', function($q) use ($user) {
            $q->where('traveler_id', $user->id);
        })->where('status', 'held')->sum('amount');
        
        return response()->json([
            'stats' => [
                'total_trips' => $totalTrips,
                'total_shipments' => $totalShipments,
                'total_earnings' => (float) $totalEarnings,
                'current_balance' => (float) $currentBalance,
                'success_rate' => $successRate,
                'response_time' => $responseTime,
                'member_since' => $user->created_at->format('Y-m-d'),
                'earnings_this_month' => (float) $earningsThisMonth,
                'pending_earnings' => (float) $pendingEarnings,
            ]
        ]);
    }
    
    /**
     * Get user recent activity
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = $request->input('limit', 10);
        
        $activities = [];
        
        // Get recent shipments delivered
        $recentShipments = Shipment::with(['trip', 'sender'])
            ->whereHas('trip', function($q) use ($user) {
                $q->where('traveler_id', $user->id);
            })
            ->where('status', 'delivered')
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();
        
        foreach ($recentShipments as $shipment) {
            $activities[] = [
                'type' => 'shipment_delivered',
                'title' => 'Colis livré avec succès',
                'description' => "{$shipment->pickup_location} → {$shipment->delivery_location} • {$shipment->package_weight} kg",
                'date' => $shipment->updated_at->toIso8601String(),
                'amount' => $shipment->price,
                'icon' => 'check_circle',
                'color' => 'green',
            ];
        }
        
        // Get recent trips published
        $recentTrips = Trip::where('traveler_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        foreach ($recentTrips as $trip) {
            $activities[] = [
                'type' => 'trip_published',
                'title' => 'Nouveau voyage publié',
                'description' => "{$trip->departure_city} → {$trip->arrival_city} • {$trip->available_capacity} kg disponibles",
                'date' => $trip->created_at->toIso8601String(),
                'amount' => null,
                'icon' => 'plane',
                'color' => 'blue',
            ];
        }
        
        // Get recent ratings received
        $recentRatings = Rating::where('rated_user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        foreach ($recentRatings as $rating) {
            $activities[] = [
                'type' => 'rating_received',
                'title' => 'Nouvel avis reçu',
                'description' => "{$rating->rating} étoiles" . ($rating->comment ? " • \"{$rating->comment}\"" : ''),
                'date' => $rating->created_at->toIso8601String(),
                'amount' => null,
                'icon' => 'star',
                'color' => 'yellow',
            ];
        }
        
        // Get recent shipments accepted
        $acceptedShipments = Shipment::with(['trip'])
            ->whereHas('trip', function($q) use ($user) {
                $q->where('traveler_id', $user->id);
            })
            ->where('status', 'accepted')
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();
        
        foreach ($acceptedShipments as $shipment) {
            $activities[] = [
                'type' => 'shipment_accepted',
                'title' => 'Colis accepté',
                'description' => "{$shipment->pickup_location} → {$shipment->delivery_location} • {$shipment->package_weight} kg",
                'date' => $shipment->updated_at->toIso8601String(),
                'amount' => null,
                'icon' => 'package',
                'color' => 'purple',
            ];
        }
        
        // Sort all activities by date
        usort($activities, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });
        
        // Limit to requested number
        $activities = array_slice($activities, 0, $limit);
        
        return response()->json([
            'activities' => $activities
        ]);
    }
    
    /**
     * Get user ratings
     * 
     * @param Request $request
     * @param string $userId
     * @return JsonResponse
     */
    public function ratings(Request $request, string $userId): JsonResponse
    {
        $ratings = Rating::with(['rater'])
            ->where('rated_user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'ratings' => $ratings->map(function($rating) {
                return [
                    'id' => $rating->id,
                    'rating' => $rating->rating,
                    'comment' => $rating->comment,
                    'created_at' => $rating->created_at->toIso8601String(),
                    'rater' => [
                        'id' => $rating->rater->id,
                        'name' => $rating->rater->name,
                        'avatar' => $rating->rater->avatar,
                    ]
                ];
            })
        ]);
    }
}
