<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Check if user has admin or super_admin role
        if (!$request->user()->isAdmin()) {
            // Log unauthorized access attempt
            AuditLog::create([
                'admin_id' => $request->user()->id,
                'action' => 'unauthorized_access',
                'resource_type' => 'admin_dashboard',
                'resource_id' => 0,
                'ip_address' => $request->ip(),
                'before' => null,
                'after' => ['attempted_route' => $request->path()],
            ]);

            return response()->json([
                'message' => 'Forbidden. Admin access required.'
            ], 403);
        }

        return $next($request);
    }
}
