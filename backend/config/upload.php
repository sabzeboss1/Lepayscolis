<?php

return [
    /*
    |--------------------------------------------------------------------------
    | File Upload Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for file uploads in the application.
    | These settings control maximum file sizes, allowed file types, and
    | upload behavior across the platform.
    |
    */

    'max_filesize' => env('UPLOAD_MAX_FILESIZE', 25600), // 25MB in KB
    'post_max_size' => env('POST_MAX_SIZE', 30720), // 30MB in KB
    'max_execution_time' => env('MAX_EXECUTION_TIME', 300), // 5 minutes

    'allowed_types' => [
        'avatar' => ['jpg', 'jpeg', 'png'],
        'kyc_document' => ['jpg', 'jpeg', 'png', 'pdf'],
        'travel_proof' => ['pdf', 'jpg', 'jpeg', 'png'],
        'branding' => ['png', 'jpg', 'jpeg', 'svg', 'ico'],
    ],

    'max_sizes' => [
        'avatar' => 2048, // 2MB in KB
        'kyc_document' => 5120, // 5MB in KB
        'travel_proof' => 25600, // 25MB in KB
        'branding_logo' => 2048, // 2MB in KB
        'branding_favicon' => 1024, // 1MB in KB
    ],

    'image_dimensions' => [
        'avatar' => [
            'width' => 200,
            'height' => 200,
        ],
        'logo' => [
            'max_width' => 500,
            'max_height' => 200,
        ],
        'favicon' => [
            'width' => 32,
            'height' => 32,
        ],
    ],
];