<?php

namespace App\Providers;

use App\Events\WalletBalanceAdjusted;
use App\Events\WalletCredited;
use App\Events\WithdrawalApproved;
use App\Events\WithdrawalCompleted;
use App\Events\WithdrawalRejected;
use App\Events\WithdrawalRequested;
use App\Listeners\NotifyAdminsOfWithdrawal;
use App\Listeners\SendBalanceAdjustmentNotification;
use App\Listeners\SendWalletCreditNotification;
use App\Listeners\SendWithdrawalNotification;
use App\Models\KYCDocument;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Rating;
use App\Models\Shipment;
use App\Models\User;
use App\Observers\KYCDocumentObserver;
use App\Observers\MessageObserver;
use App\Observers\PaymentObserver;
use App\Observers\RatingObserver;
use App\Observers\ShipmentObserver;
use App\Observers\UserObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure rate limiters
        $this->configureRateLimiting();
        
        // Register User observer
        User::observe(UserObserver::class);
        
        // Register Shipment observer
        Shipment::observe(ShipmentObserver::class);
        
        // Register Message observer
        Message::observe(MessageObserver::class);
        
        // Register Rating observer
        Rating::observe(RatingObserver::class);
        
        // Register KYCDocument observer
        KYCDocument::observe(KYCDocumentObserver::class);
        
        // Register Payment observer
        Payment::observe(PaymentObserver::class);
        
        // Register wallet event listeners
        Event::listen(
            WalletCredited::class,
            SendWalletCreditNotification::class
        );
        
        Event::listen(
            WalletBalanceAdjusted::class,
            SendBalanceAdjustmentNotification::class
        );
        
        // Register withdrawal event listeners
        Event::listen(
            WithdrawalRequested::class,
            NotifyAdminsOfWithdrawal::class
        );
        
        Event::listen(
            [WithdrawalApproved::class, WithdrawalRejected::class, WithdrawalCompleted::class],
            SendWithdrawalNotification::class
        );
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // API rate limiter: 60 requests per minute per user for authenticated requests
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Authentication endpoints: 5 requests per minute per IP
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
