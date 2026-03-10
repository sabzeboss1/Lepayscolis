<?php

namespace App\Observers;

use App\Models\Rating;
use App\Services\NotificationService;

class RatingObserver
{
    /**
     * Handle the Rating "created" event.
     * Update the rated user's average rating, completed_deliveries count, and is_recommended flag.
     * Send notification to the rated user.
     */
    public function created(Rating $rating): void
    {
        $ratedUser = $rating->toUser;
        
        if ($ratedUser) {
            // Update average rating
            $ratedUser->updateRating();
            
            // Increment completed_deliveries count
            $ratedUser->increment('completed_deliveries');
            
            // Update is_recommended flag (will be recalculated by UserObserver on save)
            $ratedUser->updateRecommendedStatus();
            
            // Send notification to rated user
            $notificationService = app(NotificationService::class);
            $notificationService->sendEmail($ratedUser, 'rating_received', [
                'rating' => $rating,
                'from_user' => $rating->fromUser,
            ]);
            
            $notificationService->createNotification(
                $ratedUser,
                'rating_received',
                __('notifications.rating_received', [], $ratedUser->locale ?? 'fr'),
                sprintf('%s/5 - %s', $rating->rating, $rating->comment ?? ''),
                [
                    'rating_id' => $rating->id,
                    'from_user_id' => $rating->from_user_id,
                    'rating_value' => $rating->rating,
                ]
            );
        }
    }
}
