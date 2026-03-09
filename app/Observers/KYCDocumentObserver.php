<?php

namespace App\Observers;

use App\Models\KYCDocument;
use App\Services\NotificationService;

class KYCDocumentObserver
{
    /**
     * Handle the KYCDocument "updated" event.
     * Update user kyc_status when KYC document status changes.
     * Send notification to user about status change.
     */
    public function updated(KYCDocument $kycDocument): void
    {
        // Check if status has changed
        if ($kycDocument->isDirty('status')) {
            $user = $kycDocument->user;
            
            if ($user) {
                // Update user's kyc_status to match the KYC document status
                $user->kyc_status = $kycDocument->status;
                $user->save();
                
                // Send notification to user about KYC status change
                $notificationService = app(NotificationService::class);
                
                if ($kycDocument->status === 'approved') {
                    $notificationService->sendEmail($user, 'kyc_approved', []);
                    $notificationService->createNotification(
                        $user,
                        'kyc_approved',
                        __('notifications.kyc_approved', [], $user->locale ?? 'fr'),
                        __('mail.kyc_approved.subject', [], $user->locale ?? 'fr'),
                        ['kyc_document_id' => $kycDocument->id]
                    );
                } elseif ($kycDocument->status === 'rejected') {
                    $notificationService->sendEmail($user, 'kyc_rejected', [
                        'reason' => $kycDocument->rejection_reason,
                    ]);
                    $notificationService->createNotification(
                        $user,
                        'kyc_rejected',
                        __('notifications.kyc_rejected', [], $user->locale ?? 'fr'),
                        $kycDocument->rejection_reason ?? '',
                        ['kyc_document_id' => $kycDocument->id]
                    );
                }
            }
        }
    }
}
