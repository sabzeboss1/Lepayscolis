# Configuration Overview - Le Pays Express Colis Backend

## Quick Reference Guide

This document provides a quick overview of all package configurations in the Laravel backend.

## Package Configuration Status

| Package | Purpose | Config File(s) | Status |
|---------|---------|----------------|--------|
| **Laravel Sanctum** | API Authentication | `config/auth.php`, `config/sanctum.php` | ✅ Configured |
| **Stripe** | Payment Processing | `config/stripe.php`, `config/services.php` | ✅ Configured |
| **AWS S3** | File Storage | `config/filesystems.php` | ✅ Configured |
| **Pusher** | WebSocket Broadcasting | `config/broadcasting.php` | ✅ Configured |
| **Eris** | Property-Based Testing | N/A (PHPUnit integration) | ✅ Installed |
| **FCM** | Push Notifications | `config/services.php` | ✅ Configured |
| **CORS** | Cross-Origin Requests | `config/cors.php` | ✅ Configured |

## Configuration Files

### Authentication & Authorization

#### `config/auth.php`
- **Web Guard**: Session-based authentication
- **API Guard**: Sanctum token-based authentication
- **User Provider**: Eloquent (App\Models\User)

#### `config/sanctum.php`
- **Token Expiration**: 7 days (10080 minutes)
- **Stateful Domains**: Configured for SPA authentication
- **Guards**: Web guard for session management

### Payment Processing

#### `config/stripe.php`
```php
'key' => env('STRIPE_KEY'),
'secret' => env('STRIPE_SECRET'),
'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
'currency' => 'eur',
'platform_fee_percentage' => 15,
```

### File Storage

#### `config/filesystems.php`
- **s3**: Default S3 disk
- **s3-public**: Public files (avatars)
  - Visibility: public
  - Bucket: AWS_PUBLIC_BUCKET
- **s3-private**: Private files (KYC documents, travel proofs)
  - Visibility: private
  - Bucket: AWS_PRIVATE_BUCKET

### Real-Time Communication

#### `config/broadcasting.php`
- **Default Driver**: Pusher (configurable via BROADCAST_CONNECTION)
- **Pusher Configuration**:
  - App ID, Key, Secret from environment
  - Cluster configuration
  - TLS/encryption enabled

### Cross-Origin Resource Sharing

#### `config/cors.php`
- **Paths**: `api/*`, `sanctum/csrf-cookie`
- **Allowed Origins**: From CORS_ALLOWED_ORIGINS env variable
- **Supports Credentials**: true (for cookie-based auth)
- **Allowed Methods**: All
- **Allowed Headers**: All

### Third-Party Services

#### `config/services.php`
```php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],

'fcm' => [
    'server_key' => env('FCM_SERVER_KEY'),
    'sender_id' => env('FCM_SENDER_ID'),
],
```

## Middleware Configuration

### `bootstrap/app.php`

#### API Middleware
- **Sanctum Frontend Requests**: Ensures stateful authentication
- **Rate Limiting**: Throttles API requests

```php
$middleware->api(prepend: [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
]);
$middleware->throttleApi();
```

## Environment Variables

### Required Variables

#### Application
```env
APP_NAME="Le Pays Express Colis"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost:8000
APP_LOCALE=fr
APP_FALLBACK_LOCALE=fr
```

#### Database
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lepaysexpresscolis
DB_USERNAME=root
DB_PASSWORD=
```

#### Cache & Queues
```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

#### Authentication
```env
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost
```

#### Payment Processing
```env
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
```

#### File Storage
```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_PUBLIC_BUCKET=
AWS_PRIVATE_BUCKET=
```

#### Real-Time Communication
```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=mt1
```

#### Push Notifications
```env
FCM_SERVER_KEY=
FCM_SENDER_ID=
```

#### CORS
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Usage Examples

### Authentication (Sanctum)
```php
// In routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
```

### File Upload (S3)
```php
// Public file (avatar)
Storage::disk('s3-public')->put('avatars', $file);

// Private file (KYC document)
Storage::disk('s3-private')->put('kyc', $file);
```

### Payment (Stripe)
```php
\Stripe\Stripe::setApiKey(config('stripe.secret'));

$paymentIntent = \Stripe\PaymentIntent::create([
    'amount' => 1000,
    'currency' => config('stripe.currency'),
]);
```

### Broadcasting (Pusher)
```php
broadcast(new MessageSent($message));
```

### Push Notification (FCM)
```php
$serverKey = config('services.fcm.server_key');
// Use FCM SDK to send notification
```

## Configuration Commands

### View Configuration
```bash
# View all configuration
php artisan config:show

# View specific configuration
php artisan config:show auth
php artisan config:show sanctum
php artisan config:show stripe
php artisan config:show filesystems
php artisan config:show broadcasting
php artisan config:show cors
php artisan config:show services
```

### Cache Configuration
```bash
# Clear configuration cache
php artisan config:clear

# Cache configuration for production
php artisan config:cache
```

### Generate Application Key
```bash
php artisan key:generate
```

## Security Considerations

### ✅ Implemented
- Token-based API authentication (Sanctum)
- 7-day token expiration
- CORS configuration for frontend
- Separate S3 buckets for public/private files
- Private file access via temporary URLs
- Webhook signature verification (Stripe)
- Rate limiting on API routes
- HTTPS enforcement in production

### 🔒 Best Practices
- Never commit `.env` file to version control
- Use strong, unique keys for all services
- Rotate API keys regularly
- Use IAM roles with minimal permissions for AWS
- Enable 2FA on all service accounts
- Monitor webhook endpoints for suspicious activity
- Use Redis password in production
- Enable database SSL in production

## Troubleshooting

### Configuration Not Loading
```bash
php artisan config:clear
php artisan cache:clear
```

### Sanctum Not Working
- Check SANCTUM_STATEFUL_DOMAINS includes frontend URL
- Verify API guard is set in auth.php
- Ensure middleware is applied to routes

### S3 Upload Failing
- Verify AWS credentials in .env
- Check bucket names and regions
- Ensure IAM user has s3:PutObject permission

### Pusher Not Broadcasting
- Verify Pusher credentials
- Check BROADCAST_CONNECTION is set to 'pusher'
- Ensure queue worker is running

### CORS Errors
- Check CORS_ALLOWED_ORIGINS includes frontend URL
- Verify credentials support is enabled
- Check browser console for specific CORS error

## Related Documentation

- [Task 1.1 Completion - Sanctum Installation](./TASK_1.1_COMPLETION.md)
- [Task 1.2 Completion - Stripe Installation](./TASK_1.2_COMPLETION.md)
- [Task 1.3 Completion - AWS S3 Installation](./TASK_1.3_COMPLETION.md)
- [Task 1.4 Completion - Pusher Installation](./TASK_1.4_COMPLETION.md)
- [Task 1.5 Completion - Eris Installation](./TASK_1.5_COMPLETION.md)
- [Task 1.6 Completion - Package Configuration](./TASK_1.6_COMPLETION.md)
- [Stripe Setup Guide](./STRIPE_SETUP.md)
- [AWS S3 Setup Guide](./AWS_S3_SETUP.md)
- [Pusher Setup Guide](./PUSHER_SETUP.md)
- [Property-Based Testing Guide](./PROPERTY_BASED_TESTING_GUIDE.md)

---

**Last Updated**: 2024  
**Maintained By**: Development Team
