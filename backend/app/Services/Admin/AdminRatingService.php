<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminRatingService
{
    public function getRatings(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = Rating::with(['fromUser', 'toUser', 'trip', 'shipment']);

        if (!empty($filters['rating'])) {
            $query->where('rating', $filters['rating']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('fromUser', fn($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('toUser', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        return $query->latest('created_at')->paginate($perPage);
    }

    public function getRatingDetails(int $ratingId): Rating
    {
        return Rating::with(['fromUser', 'toUser', 'trip', 'shipment'])->findOrFail($ratingId);
    }

    public function removeRating(int $ratingId, string $reason, User $admin): array
    {
        $rating = Rating::findOrFail($ratingId);
        $toUser = $rating->toUser;

        $before = [
            'rating' => $rating->rating,
            'user_average' => $toUser->rating,
        ];

        // Delete rating
        $rating->delete();

        // Recalculate user's average rating
        $toUser->updateRating();

        $after = [
            'deleted' => true,
            'reason' => $reason,
            'new_average' => $toUser->rating,
        ];

        AuditLog::log($admin, 'remove', 'rating', $ratingId, $before, $after);

        return [
            'message' => 'Rating removed successfully',
            'new_average' => $toUser->rating,
        ];
    }

    public function getRatingStatistics(): array
    {
        return Cache::remember('admin_rating_statistics', 3600, function () {
            $totalRatings = Rating::count();
            $averageRating = Rating::avg('rating');

            $distribution = Rating::select('rating', DB::raw('count(*) as count'))
                ->groupBy('rating')
                ->orderBy('rating')
                ->get()
                ->pluck('count', 'rating')
                ->toArray();

            // Fill missing ratings with 0
            for ($i = 1; $i <= 5; $i++) {
                if (!isset($distribution[$i])) {
                    $distribution[$i] = 0;
                }
            }
            ksort($distribution);

            return [
                'total_ratings' => $totalRatings,
                'average_rating' => round($averageRating, 2),
                'distribution' => $distribution,
            ];
        });
    }
}
