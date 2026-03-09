<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user has super_admin role
        if (!$request->user() || !$request->user()->isSuperAdmin()) {
            return response()->json([
                'message' => 'Forbidden. Super admin access required.'
            ], 403);
        }

        return $next($request);
    }
}
