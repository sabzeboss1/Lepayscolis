<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureKYCVerified
{
    /**
     * Handle an incoming request.
     *
     * Ensures that the authenticated user has an approved KYC status.
     * Returns 403 Forbidden if the user's KYC is not approved.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->kyc_status !== 'approved') {
            return response()->json([
                'message' => 'KYC verification required',
                'kyc_status' => $user ? $user->kyc_status : 'pending'
            ], 403);
        }

        return $next($request);
    }
}
