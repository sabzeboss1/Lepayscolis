<?php

namespace App\Providers;

use App\Events\ShipmentBidAccepted;
use App\Events\ShipmentBidRejected;
use App\Events\ShipmentBidSubmitted;
use App\Listeners\SendShipmentBidNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        ShipmentBidSubmitted::class => [
            SendShipmentBidNotification::class . '@handleBidSubmitted',
        ],
        ShipmentBidAccepted::class => [
            SendShipmentBidNotification::class . '@handleBidAccepted',
        ],
        ShipmentBidRejected::class => [
            SendShipmentBidNotification::class . '@handleBidRejected',
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
