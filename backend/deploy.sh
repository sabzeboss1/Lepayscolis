#!/bin/bash
set -e

echo "==> Starting deployment..."

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    echo "==> Generating application key..."
    php artisan key:generate --force
fi

# Clear and cache config
echo "==> Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
echo "==> Running migrations..."
php artisan migrate --force

# Run seeders (only seeds if tables are empty thanks to firstOrCreate patterns)
echo "==> Running seeders..."
php artisan db:seed --force

# Link storage
echo "==> Linking storage..."
php artisan storage:link --force 2>/dev/null || true

echo "==> Deployment complete!"

# Start the application
echo "==> Starting server..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
