<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendEmailNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public User $user,
        public string $template,
        public array $data
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Get the mailable class based on template name
            $mailableClass = $this->getMailableClass($this->template);
            
            if (!$mailableClass) {
                Log::error('Unknown email template', [
                    'template' => $this->template,
                    'user_id' => $this->user->id,
                ]);
                return;
            }

            // Create mailable instance with data
            $mailable = new $mailableClass($this->user, $this->data);

            // Send email
            Mail::to($this->user->email)->send($mailable);

            Log::info('Email notification sent', [
                'user_id' => $this->user->id,
                'template' => $this->template,
                'email' => $this->user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send email notification', [
                'user_id' => $this->user->id,
                'template' => $this->template,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get the mailable class for a template name.
     */
    private function getMailableClass(string $template): ?string
    {
        $mailables = [
            'shipment_created' => \App\Mail\ShipmentCreated::class,
            'shipment_accepted' => \App\Mail\ShipmentAccepted::class,
            'shipment_in_transit' => \App\Mail\ShipmentInTransit::class,
            'shipment_delivered' => \App\Mail\ShipmentDelivered::class,
            'kyc_approved' => \App\Mail\KYCApproved::class,
            'kyc_rejected' => \App\Mail\KYCRejected::class,
            'rating_received' => \App\Mail\RatingReceived::class,
            'payment_released' => \App\Mail\PaymentReleased::class,
            'payment_refunded' => \App\Mail\PaymentRefunded::class,
        ];

        return $mailables[$template] ?? null;
    }
}
