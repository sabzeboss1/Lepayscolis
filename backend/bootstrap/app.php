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
        // Apply locale detection and currency conversion to all API requests
        $middleware->api(append: [
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\CurrencyConversionMiddleware::class,
        ]);

        // Configure rate limiting for API
        $middleware->throttleApi();

        // Exclude all API routes from CSRF (API uses Sanctum token auth, not sessions)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Redirect guests to JSON response instead of login page for API routes
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // Don't redirect, let exception handler deal with it
            }
            return route('login');
        });

        // Register custom middleware aliases
        $middleware->alias([
            'kyc.verified' => \App\Http\Middleware\EnsureKYCVerified::class,
            'trip.owner' => \App\Http\Middleware\CheckTripOwnership::class,
            'shipment.access' => \App\Http\Middleware\CheckShipmentAccess::class,
            'admin' => \App\Http\Middleware\EnsureAdminRole::class,
            'super-admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
            'optional.auth' => \App\Http\Middleware\OptionalAuth::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle authentication exceptions for API routes
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }
        });

        // Handle model not found exceptions
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Resource not found.'
                ], 404);
            }
        });
    })->create();
