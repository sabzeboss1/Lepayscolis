<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Apply locale detection to all API requests
        $middleware->api(append: [
            \App\Http\Middleware\SetLocale::class,
        ]);

        // Configure rate limiting for API
        $middleware->throttleApi();

        // Exclude all API routes from CSRF (API uses Sanctum token auth, not sessions)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Register custom middleware aliases
        $middleware->alias([
            'kyc.verified' => \App\Http\Middleware\EnsureKYCVerified::class,
            'trip.owner' => \App\Http\Middleware\CheckTripOwnership::class,
            'shipment.access' => \App\Http\Middleware\CheckShipmentAccess::class,
            'admin' => \App\Http\Middleware\EnsureAdminRole::class,
            'super-admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
