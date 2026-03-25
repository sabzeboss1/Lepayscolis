<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\KYCController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\TravelProofController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\SetupController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Setup & Health Routes (no auth)
|--------------------------------------------------------------------------
*/
Route::post('/setup', SetupController::class);
Route::get('/health', [SetupController::class, 'health']);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Broadcasting authentication (for Pusher private/presence channels)
Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Public utility routes
Route::get('/languages', [UserController::class, 'supportedLanguages']);
Route::get('/currencies', function () {
    $currencies = app(\App\Services\CurrencyService::class)->getActiveCurrencies();
    return response()->json(['data' => $currencies]);
});
Route::get('/countries', [CountryController::class, 'index']);
Route::get('/countries/{id}/cities', [CountryController::class, 'cities']);

// Webhook routes (public, no authentication required)
Route::prefix('webhooks')->group(function () {
    Route::post('/stripe', [WebhookController::class, 'handleStripeWebhook']);
});

// Protected authentication routes
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// KYC routes (protected)
Route::middleware('auth:sanctum')->prefix('kyc')->group(function () {
    Route::get('/', [KYCController::class, 'show']);
    Route::post('/', [KYCController::class, 'store']);
    Route::get('/status', [KYCController::class, 'status']);
});

// Trip routes
Route::prefix('trips')->group(function () {
    // Public routes
    Route::get('/', [TripController::class, 'index']);

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/my', [TripController::class, 'myTrips']);
        Route::get('/{id}/shipments', [TripController::class, 'shipments']);

        // Routes requiring KYC verification
        Route::middleware('kyc.verified')->group(function () {
            Route::post('/', [TripController::class, 'store']);
        });

        // Routes requiring trip ownership
        Route::middleware('trip.owner')->group(function () {
            Route::put('/{id}', [TripController::class, 'update']);
            Route::delete('/{id}', [TripController::class, 'destroy']);
        });
    });

    // Public trip details (after /my to avoid route conflict)
    Route::get('/{id}', [TripController::class, 'show']);
});

// Serve travel proof files (public - anyone can view) - Outside trips group to avoid route conflict
Route::get('/trips/{id}/travel-proof', [TravelProofController::class, 'show']);

// Shipment routes
Route::prefix('shipments')->group(function () {
    // Public routes
    Route::get('/', [ShipmentController::class, 'index']);

    // Available shipments for travelers (public - anyone can browse)
    Route::get('/available', [ShipmentController::class, 'available']);

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // My shipments route (must come before /{id} to avoid conflict)
        Route::get('/my', [ShipmentController::class, 'myShipments']);

        // Routes requiring KYC verification
        Route::middleware('kyc.verified')->group(function () {
            Route::post('/', [ShipmentController::class, 'store']);
            Route::put('/{id}', [ShipmentController::class, 'update']);
            Route::post('/{id}/confirm-delivery', [ShipmentController::class, 'confirmDelivery']);
            Route::post('/{id}/accept', [ShipmentController::class, 'accept']);
            Route::post('/{id}/reject', [ShipmentController::class, 'reject']);
        });
    });

    // Public shipment details (after /my to avoid route conflict)
    Route::get('/{id}', [ShipmentController::class, 'show']);
});

// Message routes (protected, require KYC verification)
Route::middleware(['auth:sanctum', 'kyc.verified'])->prefix('messages')->group(function () {
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::get('/conversation-with/{userId}', [MessageController::class, 'getOrCreateConversation']);
    Route::get('/unread-count', [MessageController::class, 'unreadCount']);
    Route::get('/{conversationId}', [MessageController::class, 'index']);
    Route::post('/', [MessageController::class, 'store']);
    Route::patch('/{messageId}/mark-read', [MessageController::class, 'markAsRead']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// User routes (protected)
Route::middleware('auth:sanctum')->prefix('users')->group(function () {
    // Update own profile
    Route::put('/profile', [UserController::class, 'updateProfile']);

    // Upload avatar
    Route::post('/avatar', [UserController::class, 'uploadAvatar']);

    // Update FCM token
    Route::post('/fcm-token', [UserController::class, 'updateFcmToken']);

    // Get user stats
    Route::get('/stats', [\App\Http\Controllers\UserStatsController::class, 'stats']);

    // Get user activity
    Route::get('/activity', [\App\Http\Controllers\UserStatsController::class, 'activity']);
});

// Public user profile route (must be after protected routes to avoid conflicts)
Route::get('/users/{id}', [UserController::class, 'show']);

// User ratings route (public)
Route::get('/users/{id}/ratings', [\App\Http\Controllers\UserStatsController::class, 'ratings']);

// Rating routes
Route::prefix('ratings')->group(function () {
    // Public routes
    Route::get('/', [RatingController::class, 'index']);

    // Protected routes (require authentication and KYC verification)
    Route::middleware(['auth:sanctum', 'kyc.verified'])->group(function () {
        Route::post('/', [RatingController::class, 'store']);
    });
});

// Wallet routes (protected, require KYC verification)
Route::middleware(['auth:sanctum', 'kyc.verified'])->prefix('wallet')->group(function () {
    Route::get('/', [\App\Http\Controllers\WalletController::class, 'show'])->middleware('throttle:60,1');
    Route::get('/transactions', [\App\Http\Controllers\WalletController::class, 'transactions'])->middleware('throttle:60,1');
});

// Withdrawal routes (protected, require KYC verification)
Route::middleware(['auth:sanctum', 'kyc.verified'])->prefix('withdrawals')->group(function () {
    Route::post('/', [\App\Http\Controllers\WithdrawalController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/', [\App\Http\Controllers\WithdrawalController::class, 'index'])->middleware('throttle:60,1');
    Route::get('/{id}', [\App\Http\Controllers\WithdrawalController::class, 'show'])->middleware('throttle:60,1');
    Route::delete('/{id}', [\App\Http\Controllers\WithdrawalController::class, 'cancel'])->middleware('throttle:30,1');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| All admin routes require authentication and admin role.
| Super admin routes require super_admin role.
| Rate limiting: 60/min for read, 30/min for write, 5/15min for login
|
*/

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminKYCController;
use App\Http\Controllers\Admin\AdminTripController;
use App\Http\Controllers\Admin\AdminShipmentController;
use App\Http\Controllers\Admin\AdminWalletController;
use App\Http\Controllers\Admin\AdminWithdrawalController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminMessageController;
use App\Http\Controllers\Admin\AdminRatingController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminAnalyticsController;
use App\Http\Controllers\Admin\AdminAuditLogController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\AdminExportController;
use App\Http\Controllers\Admin\AdminUserManagementController;
use App\Http\Controllers\Admin\AdminCurrencyController;
use App\Http\Controllers\Admin\AdminCountryController;
use App\Http\Controllers\Admin\AdminCityController;

// Admin authentication routes (public)
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:5,15');
});

// Admin protected routes (require authentication and admin role)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

    // Authentication
    Route::get('/me', [AdminAuthController::class, 'me']);
    Route::post('/logout', [AdminAuthController::class, 'logout']);

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/metrics', [AdminDashboardController::class, 'metrics'])->middleware('throttle:60,1');
        Route::get('/charts', [AdminDashboardController::class, 'charts'])->middleware('throttle:60,1');
        Route::get('/activity', [AdminDashboardController::class, 'activity'])->middleware('throttle:60,1');
    });

    // User Management
    Route::prefix('users')->group(function () {
        Route::get('/', [AdminUserController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/', [AdminUserController::class, 'store'])->middleware('throttle:30,1');
        Route::post('/bulk-suspend', [AdminUserController::class, 'bulkSuspend'])->middleware('throttle:30,1');
        Route::post('/bulk-activate', [AdminUserController::class, 'bulkActivate'])->middleware('throttle:30,1');
        Route::get('/{id}', [AdminUserController::class, 'show'])->middleware('throttle:60,1');
        Route::put('/{id}', [AdminUserController::class, 'update'])->middleware('throttle:30,1');
        Route::post('/{id}/suspend', [AdminUserController::class, 'suspend'])->middleware('throttle:30,1');
        Route::post('/{id}/activate', [AdminUserController::class, 'activate'])->middleware('throttle:30,1');
        Route::delete('/{id}', [AdminUserController::class, 'destroy'])->middleware('throttle:30,1');
        Route::post('/{id}/ban-messaging', [AdminUserController::class, 'banMessaging'])->middleware('throttle:30,1');
        Route::post('/{id}/unban-messaging', [AdminUserController::class, 'unbanMessaging'])->middleware('throttle:30,1');
    });

    // KYC Management
    Route::prefix('kyc')->group(function () {
        Route::get('/', [AdminKYCController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/{id}', [AdminKYCController::class, 'show'])->middleware('throttle:60,1');
        Route::post('/{id}/approve', [AdminKYCController::class, 'approve'])->middleware('throttle:30,1');
        Route::post('/{id}/reject', [AdminKYCController::class, 'reject'])->middleware('throttle:30,1');
        Route::post('/bulk-approve', [AdminKYCController::class, 'bulkApprove'])->middleware('throttle:30,1');
        Route::post('/bulk-reject', [AdminKYCController::class, 'bulkReject'])->middleware('throttle:30,1');

        // Serve KYC document files (admin only)
        Route::get('/files/{userId}/{filename}', function ($userId, $filename) {
            $path = "kyc/{$userId}/{$filename}";

            if (!Storage::disk('local')->exists($path)) {
                abort(404, 'File not found');
            }

            $file = Storage::disk('local')->get($path);
            $mimeType = Storage::disk('local')->mimeType($path);

            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Cache-Control', 'private, max-age=3600');
        })->where('filename', '.*')->middleware('throttle:60,1');
    });

    // Trip Management
    Route::prefix('trips')->group(function () {
        Route::get('/', [AdminTripController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/analytics', [AdminTripController::class, 'analytics'])->middleware('throttle:60,1');
        Route::get('/pending', [AdminTripController::class, 'pending'])->middleware('throttle:60,1');
        Route::get('/{id}', [AdminTripController::class, 'show'])->middleware('throttle:60,1');
        Route::put('/{id}', [AdminTripController::class, 'update'])->middleware('throttle:30,1');
        Route::post('/{id}/verify', [AdminTripController::class, 'verify'])->middleware('throttle:30,1');
        Route::post('/{id}/reject', [AdminTripController::class, 'reject'])->middleware('throttle:30,1');
        Route::post('/{id}/cancel', [AdminTripController::class, 'cancel'])->middleware('throttle:30,1');
        Route::post('/bulk-verify', [AdminTripController::class, 'bulkVerify'])->middleware('throttle:30,1');
        Route::post('/bulk-reject', [AdminTripController::class, 'bulkReject'])->middleware('throttle:30,1');
    });

    // Shipment Management
    Route::prefix('shipments')->group(function () {
        Route::get('/', [AdminShipmentController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/analytics', [AdminShipmentController::class, 'analytics'])->middleware('throttle:60,1');
        Route::get('/{id}', [AdminShipmentController::class, 'show'])->middleware('throttle:60,1');
        Route::post('/{id}/resolve-dispute', [AdminShipmentController::class, 'resolveDispute'])->middleware('throttle:30,1');
        Route::post('/{id}/cancel', [AdminShipmentController::class, 'cancel'])->middleware('throttle:30,1');
    });

    // Wallet Management
    Route::prefix('wallets')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\WalletManagementController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/audit-logs', [\App\Http\Controllers\Admin\WalletManagementController::class, 'auditLogs'])->middleware('throttle:60,1');
        Route::get('/{userId}', [\App\Http\Controllers\Admin\WalletManagementController::class, 'show'])->middleware('throttle:60,1');
        Route::post('/{userId}/adjust', [\App\Http\Controllers\Admin\WalletManagementController::class, 'adjustBalance'])->middleware('throttle:30,1');
    });

    // Withdrawal Management
    Route::prefix('withdrawals')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\WithdrawalManagementController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/{id}/approve', [\App\Http\Controllers\Admin\WithdrawalManagementController::class, 'approve'])->middleware('throttle:30,1');
        Route::post('/{id}/reject', [\App\Http\Controllers\Admin\WithdrawalManagementController::class, 'reject'])->middleware('throttle:30,1');
        Route::post('/{id}/processing', [\App\Http\Controllers\Admin\WithdrawalManagementController::class, 'markProcessing'])->middleware('throttle:30,1');
        Route::post('/{id}/complete', [\App\Http\Controllers\Admin\WithdrawalManagementController::class, 'complete'])->middleware('throttle:30,1');
    });

    // Payment Management
    Route::prefix('payments')->group(function () {
        Route::get('/', [AdminPaymentController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/analytics', [AdminPaymentController::class, 'analytics'])->middleware('throttle:60,1');
        Route::get('/{id}', [AdminPaymentController::class, 'show'])->middleware('throttle:60,1');
        Route::post('/{id}/refund', [AdminPaymentController::class, 'refund'])->middleware('throttle:30,1');
    });

    // Messaging Moderation
    Route::prefix('messages')->group(function () {
        Route::get('/conversations', [AdminMessageController::class, 'conversations'])->middleware('throttle:60,1');
        Route::get('/conversations/{id}', [AdminMessageController::class, 'show'])->middleware('throttle:60,1');
        Route::delete('/{id}', [AdminMessageController::class, 'destroy'])->middleware('throttle:30,1');
    });

    // Rating Management
    Route::prefix('ratings')->group(function () {
        Route::get('/', [AdminRatingController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/statistics', [AdminRatingController::class, 'statistics'])->middleware('throttle:60,1');
        Route::get('/{id}', [AdminRatingController::class, 'show'])->middleware('throttle:60,1');
        Route::delete('/{id}', [AdminRatingController::class, 'destroy'])->middleware('throttle:30,1');
    });

    // Platform Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [AdminSettingsController::class, 'index'])->middleware('throttle:60,1');
        Route::put('/', [AdminSettingsController::class, 'update'])->middleware('throttle:30,1');
        Route::post('/upload', [AdminSettingsController::class, 'uploadBrandingAsset'])->middleware('throttle:10,1');
    });

    // Country Management
    Route::prefix('countries')->group(function () {
        Route::get('/', [AdminCountryController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/', [AdminCountryController::class, 'store'])->middleware('throttle:30,1');
        Route::put('/{id}', [AdminCountryController::class, 'update'])->middleware('throttle:30,1');
        Route::post('/{id}/toggle', [AdminCountryController::class, 'toggle'])->middleware('throttle:30,1');
        Route::delete('/{id}', [AdminCountryController::class, 'destroy'])->middleware('throttle:30,1');
    });

    // City Management
    Route::prefix('cities')->group(function () {
        Route::get('/', [AdminCityController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/', [AdminCityController::class, 'store'])->middleware('throttle:30,1');
        Route::put('/{id}', [AdminCityController::class, 'update'])->middleware('throttle:30,1');
        Route::post('/{id}/toggle', [AdminCityController::class, 'toggle'])->middleware('throttle:30,1');
        Route::delete('/{id}', [AdminCityController::class, 'destroy'])->middleware('throttle:30,1');
    });

    // Currency Management
    Route::prefix('currencies')->group(function () {
        Route::get('/', [AdminCurrencyController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/', [AdminCurrencyController::class, 'store'])->middleware('throttle:30,1');
        Route::put('/{code}', [AdminCurrencyController::class, 'update'])->middleware('throttle:30,1');
        Route::put('/{code}/rate', [AdminCurrencyController::class, 'updateRate'])->middleware('throttle:30,1');
        Route::post('/{code}/toggle', [AdminCurrencyController::class, 'toggle'])->middleware('throttle:30,1');
        Route::delete('/{code}', [AdminCurrencyController::class, 'destroy'])->middleware('throttle:30,1');
    });

    // Analytics
    Route::prefix('analytics')->group(function () {
        Route::get('/', [AdminAnalyticsController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/users', [AdminAnalyticsController::class, 'users'])->middleware('throttle:60,1');
        Route::get('/revenue', [AdminAnalyticsController::class, 'revenue'])->middleware('throttle:60,1');
        Route::get('/transactions', [AdminAnalyticsController::class, 'transactions'])->middleware('throttle:60,1');
        Route::get('/routes', [AdminAnalyticsController::class, 'routes'])->middleware('throttle:60,1');
        Route::get('/engagement', [AdminAnalyticsController::class, 'engagement'])->middleware('throttle:60,1');
        Route::post('/export', [AdminAnalyticsController::class, 'export'])->middleware('throttle:30,1');
    });

    // Audit Logs
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AdminAuditLogController::class, 'index'])->middleware('throttle:60,1');
        Route::get('/{id}', [AdminAuditLogController::class, 'show'])->middleware('throttle:60,1');
        Route::post('/export', [AdminAuditLogController::class, 'export'])->middleware('throttle:30,1');
    });

    // Data Export
    Route::prefix('export')->group(function () {
        Route::post('/users', [AdminExportController::class, 'users'])->middleware('throttle:30,1');
        Route::post('/trips', [AdminExportController::class, 'trips'])->middleware('throttle:30,1');
        Route::post('/shipments', [AdminExportController::class, 'shipments'])->middleware('throttle:30,1');
        Route::post('/payments', [AdminExportController::class, 'payments'])->middleware('throttle:30,1');
        Route::post('/withdrawals', [AdminExportController::class, 'withdrawals'])->middleware('throttle:30,1');
        Route::get('/status/{jobId}', [AdminExportController::class, 'status'])->middleware('throttle:60,1');
    });
});

// Super Admin routes (require super_admin role)
Route::middleware(['auth:sanctum', 'super-admin'])->prefix('admin')->group(function () {

    // Admin User Management
    Route::prefix('admins')->group(function () {
        Route::get('/', [AdminUserManagementController::class, 'index'])->middleware('throttle:60,1');
        Route::post('/', [AdminUserManagementController::class, 'store'])->middleware('throttle:30,1');
        Route::put('/{id}/role', [AdminUserManagementController::class, 'updateRole'])->middleware('throttle:30,1');
        Route::delete('/{id}', [AdminUserManagementController::class, 'destroy'])->middleware('throttle:30,1');
        Route::get('/{id}/activity', [AdminUserManagementController::class, 'activity'])->middleware('throttle:60,1');
    });

    // Assign admin role (also in super admin section)
    Route::post('/users/{id}/assign-admin', [AdminUserController::class, 'assignAdmin'])->middleware('throttle:30,1');

    // Platform Notifications
    Route::prefix('notifications')->group(function () {
        Route::post('/send', [AdminNotificationController::class, 'send'])->middleware('throttle:30,1');
        Route::get('/history', [AdminNotificationController::class, 'history'])->middleware('throttle:60,1');
    });
});
