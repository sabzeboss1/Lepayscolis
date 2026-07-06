<?php

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BackupAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowedEmails = array_map('trim', explode(',', PlatformSetting::get('backup_notify_email', '')));
        $allowedEmails = array_filter($allowedEmails);

        if (empty($allowedEmails) || !in_array($request->user()->email, $allowedEmails)) {
            return response()->json([
                'message' => 'Accès non autorisé à la gestion des sauvegardes.',
            ], 403);
        }

        return $next($request);
    }
}
