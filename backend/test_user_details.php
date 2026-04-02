<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $service = new App\Services\Admin\AdminUserService();
    $details = $service->getUserDetails(14);
    echo "Success: User details retrieved\n";
    echo "User name: " . $details['user']->name . "\n";
    echo "Activity history: " . json_encode($details['activity_history']) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}