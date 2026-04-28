<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConfigureUploadLimits
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Configure PHP upload limits dynamically
        $maxFilesize = config('upload.max_filesize', 25600); // KB
        $postMaxSize = config('upload.post_max_size', 30720); // KB
        $maxExecutionTime = config('upload.max_execution_time', 300); // seconds

        // Convert KB to bytes for PHP ini settings
        $maxFilesizeBytes = $maxFilesize * 1024;
        $postMaxSizeBytes = $postMaxSize * 1024;

        // Set PHP configuration
        ini_set('upload_max_filesize', $maxFilesizeBytes);
        ini_set('post_max_size', $postMaxSizeBytes);
        ini_set('max_execution_time', $maxExecutionTime);
        ini_set('max_input_time', $maxExecutionTime);
        ini_set('memory_limit', '256M');

        return $next($request);
    }
}