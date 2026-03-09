# Quick Start: Service Configuration Guide

This guide helps you quickly set up all required services for the Le Pays Express Colis backend.

## Prerequisites

- PHP 8.2+
- Composer
- MySQL 8.0+
- Redis
- Node.js (for frontend)

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
cd lepaysexpresscolis-backend
composer install
cp .env.example .env
php artisan key:generate
```

### 2. Configure Database (Task 2.2)

**Create MySQL Database:**
```sql
CREATE DATABASE lepaysexpresscolis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Update .env:**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lepaysexpresscolis
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

**Test Connection:**
```bash
php artisan migrate:status
```

### 3. Configure Redis (Task 2.3)

**Install Redis:**
- Windows: Download from https://github.com/microsoftarchive/redis/releases
- Linux: `sudo apt-get install redis-server`
- macOS: `brew install redis`

**Start Redis:**
```bash
redis-server
```

**Update .env:**
```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

**Test Redis:**
```bash
php artisan tinker
>>> Cache::put('test', 'value', 60);
>>> Cache::get('test');
```

### 4. Configure Mail Service (Task 2.4)

**For Development (Mailtrap):**
1. Sign up at https://mailtrap.io
2. Get SMTP credentials from your inbox

**Update .env:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@lepaysexpresscolis.com"
MAIL_FROM_NAME="Le Pays Express Colis"
```

**For Production (SendGrid/Mailgun):**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_ENCRYPTION=tls
```

**Test Email:**
```bash
php artisan tinker
>>> Mail::raw('Test', function($msg) { $msg->to('test@example.com')->subject('Test'); });
```

### 5. Configure AWS S3 (Task 2.5)

**Create S3 Buckets:**
1. Log in to AWS Console
2. Create two buckets:
   - `lepaysexpresscolis-public` (for avatars)
   - `lepaysexpresscolis-private` (for documents)

**Set Public Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::lepaysexpresscolis-public/*"
    }
  ]
}
```

**Create IAM User:**
1. Create user with programmatic access
2. Attach policy: `AmazonS3FullAccess` (or custom policy)
3. Save Access Key ID and Secret Access Key

**Update .env:**
```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=lepaysexpresscolis-public
AWS_PUBLIC_BUCKET=lepaysexpresscolis-public
AWS_PRIVATE_BUCKET=lepaysexpresscolis-private
```

**Test S3:**
```bash
php artisan tinker
>>> Storage::disk('s3-public')->put('test.txt', 'Hello World');
>>> Storage::disk('s3-public')->exists('test.txt');
```

### 6. Configure Stripe (Task 2.6)

**Get Stripe Keys:**
1. Sign up at https://stripe.com
2. Go to Developers > API keys
3. Copy Publishable key and Secret key

**Update .env:**
```env
STRIPE_KEY=pk_test_your_publishable_key
STRIPE_SECRET=sk_test_your_secret_key
```

**Set Up Webhook:**
1. Go to Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `transfer.created`
   - `transfer.failed`
4. Copy Signing secret

**Update .env:**
```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 7. Configure Pusher (Task 2.7)

**Get Pusher Credentials:**
1. Sign up at https://pusher.com
2. Create new app
3. Copy credentials from App Keys

**Update .env:**
```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
```

**Test Pusher:**
```bash
php artisan tinker
>>> event(new App\Events\TestEvent());
```

### 8. Configure Firebase (Task 2.8)

**Get FCM Credentials:**
1. Go to https://console.firebase.google.com
2. Create new project
3. Go to Project Settings > Cloud Messaging
4. Copy Server Key and Sender ID

**Update .env:**
```env
FCM_SERVER_KEY=your_server_key
FCM_SENDER_ID=your_sender_id
```

### 9. Configure CORS (Task 2.9)

**Update .env:**
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost
```

**For Multiple Origins:**
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com,https://www.example.com
```

## Verification

Run the configuration verification tests:

```bash
php artisan test --filter=ConfigurationVerificationTest
```

All tests should pass ✓

## Run Migrations

```bash
php artisan migrate
```

## Start Development Server

```bash
# Start queue worker
php artisan queue:work

# Start development server
php artisan serve
```

## Troubleshooting

### Database Connection Failed
- Verify MySQL is running
- Check database credentials in .env
- Ensure database exists

### Redis Connection Failed
- Verify Redis is running: `redis-cli ping`
- Check Redis host and port in .env

### S3 Upload Failed
- Verify AWS credentials
- Check bucket names and regions
- Ensure IAM user has S3 permissions

### Mail Not Sending
- Check SMTP credentials
- Verify mail server is accessible
- Check firewall settings

### Pusher Not Working
- Verify Pusher credentials
- Check cluster setting
- Ensure BROADCAST_CONNECTION=pusher

## Production Checklist

- [ ] Use production database credentials
- [ ] Set Redis password
- [ ] Use production SMTP service
- [ ] Use production S3 buckets
- [ ] Use Stripe live keys
- [ ] Set APP_ENV=production
- [ ] Set APP_DEBUG=false
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure queue workers with Supervisor
- [ ] Set up monitoring (Sentry, etc.)

## Support

For issues or questions, refer to:
- [Configuration Verification Document](./TASK_2.2-2.9_VERIFICATION.md)
- [Laravel Documentation](https://laravel.com/docs)
- [Project README](../README.md)
