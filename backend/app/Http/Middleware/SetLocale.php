<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Supported locales.
     */
    private const SUPPORTED_LOCALES = ['fr', 'en'];

    /**
     * Handle an incoming request.
     *
     * Locale priority:
     * 1. Query parameter ?lang=
     * 2. Authenticated user's locale preference
     * 3. Accept-Language header
     * 4. App default (config)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);

        App::setLocale($locale);

        $response = $next($request);

        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    private function resolveLocale(Request $request): string
    {
        // 1. Query parameter
        if ($request->has('lang') && in_array($request->query('lang'), self::SUPPORTED_LOCALES)) {
            return $request->query('lang');
        }

        // 2. Authenticated user preference
        if ($request->user() && in_array($request->user()->locale, self::SUPPORTED_LOCALES)) {
            return $request->user()->locale;
        }

        // 3. Accept-Language header
        $acceptLanguage = $request->header('Accept-Language');
        if ($acceptLanguage) {
            $preferred = substr($acceptLanguage, 0, 2);
            if (in_array($preferred, self::SUPPORTED_LOCALES)) {
                return $preferred;
            }
        }

        // 4. Default
        return config('app.locale', 'en');
    }
}
