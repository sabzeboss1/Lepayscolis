<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

class OptionalAuth
{
    /**
     * Handle an incoming request.
     * 
     * This middleware attempts to authenticate the user but doesn't fail if authentication fails.
     * It allows both authenticated and unauthenticated users to access the route.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\JsonResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Try to authenticate using Sanctum
        if ($request->bearerToken()) {
            try {
                // Use Sanctum's authentication logic
                $guard = Auth::guard('sanctum');
                $user = $guard->user();
                
                if ($user) {
                    // Set the authenticated user
                    Auth::setUser($user);
                    $request->setUserResolver(function () use ($user) {
                        return $user;
                    });
                }
            } catch (\Exception $e) {
                // Authentication failed, but we continue without authentication
                // This allows the route to be accessed by unauthenticated users
            }
        }

        return $next($request);
    }
}