# Admin User Setup Guide

This guide explains how to create and manage admin users for the LePaysExpressColis backend.

## Quick Start

### Option 1: Using Database Seeder (Recommended for Development)

Run the database seeder to create default admin users:

```bash
php artisan db:seed --class=AdminUserSeeder
```

This will create:
- **Super Admin**: `superadmin@lepaysexpresscolis.com` / `super123`
- **Admin**: `admin@lepaysexpresscolis.com` / `admin123`

### Option 2: Using Artisan Command

Create a custom admin user interactively:

```bash
php artisan admin:create
```

You'll be prompted for:
- Email address
- Name
- Password (minimum 8 characters)
- Role (admin or super_admin)

#### Non-Interactive Mode

Create an admin user with command-line options:

```bash
# Create regular admin
php artisan admin:create --email=admin@example.com --password=secret123 --name="John Doe"

# Create super admin
php artisan admin:create --email=superadmin@example.com --password=secret123 --name="Jane Doe" --super
```

## Admin Roles

### Admin (`role: 'admin'`)
- Access to admin dashboard
- User management (view, suspend, activate)
- KYC verification (approve, reject)
- Trip and shipment management
- Wallet and withdrawal management
- Payment management
- Message moderation
- Rating management
- Analytics and reports
- Audit logs

### Super Admin (`role: 'super_admin'`)
- All admin privileges
- Admin user management (create, update, delete admins)
- Platform settings configuration
- System-wide notifications
- Advanced analytics

## Database Schema

Admin users are stored in the `users` table with:
- `role` field set to `'admin'` or `'super_admin'`
- `kyc_status` set to `'approved'` (admins don't need KYC)
- Standard user fields (name, email, password, phone)

## Authentication Flow

1. Admin logs in via `/api/admin/login` endpoint
2. Backend validates credentials and checks `role` field
3. If role is `admin` or `super_admin`, authentication succeeds
4. Sanctum token is created with `['admin']` abilities
5. Admin session is recorded in `admin_sessions` table
6. Token expires after 8 hours (configurable in `AdminAuthService`)

## Middleware Protection

### Admin Middleware (`admin`)
- Checks if authenticated user has `admin` or `super_admin` role
- Applied to all `/api/admin/*` routes (except login)

### Super Admin Middleware (`super-admin`)
- Checks if authenticated user has `super_admin` role
- Applied to sensitive routes like admin management

## Security Features

### Rate Limiting
- Login attempts: 5 attempts per 15 minutes
- Failed attempts trigger 30-minute block
- Tracked by IP address in `login_attempts` table

### Session Management
- Sessions expire after 8 hours
- Tracked in `admin_sessions` table
- Includes IP address and user agent
- Logout invalidates both session and token

### Audit Logging
- All admin actions are logged in `audit_logs` table
- Includes: action type, entity, changes, IP, timestamp
- Accessible via admin dashboard

## Frontend Integration

### Admin Login Page
- URL: `http://localhost:3000/admin/login`
- Calls `/api/admin/login` endpoint
- Stores token in `localStorage` as `admin_token`
- Stores user info in `localStorage` as `admin_user`

### Admin Dashboard
- URL: `http://localhost:3000/admin/dashboard`
- Protected by admin authentication
- Redirects to login if not authenticated

## Troubleshooting

### "Cannot login as admin"

1. **Check if admin user exists:**
   ```bash
   php artisan tinker
   >>> User::where('email', 'admin@lepaysexpresscolis.com')->first()
   ```

2. **Check role field:**
   ```bash
   >>> User::where('email', 'admin@lepaysexpresscolis.com')->value('role')
   ```
   Should return `'admin'` or `'super_admin'`

3. **Create admin user if missing:**
   ```bash
   php artisan admin:create --email=admin@lepaysexpresscolis.com --password=admin123 --name="Admin"
   ```

### "Access denied" error

- Verify the user's `role` field is set to `'admin'` or `'super_admin'`
- Check if the `admin` middleware is properly configured
- Verify the token has `['admin']` abilities

### "Too many login attempts"

- Wait 30 minutes for the rate limit to reset
- Or clear failed attempts from database:
  ```bash
  php artisan tinker
  >>> App\Models\LoginAttempt::where('ip_address', 'YOUR_IP')->delete()
  ```

## Production Considerations

1. **Change default passwords:**
   ```bash
   php artisan tinker
   >>> $user = User::where('email', 'admin@lepaysexpresscolis.com')->first();
   >>> $user->password = Hash::make('new-secure-password');
   >>> $user->save();
   ```

2. **Use strong passwords:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Use password manager

3. **Enable 2FA (future enhancement):**
   - Consider implementing two-factor authentication
   - Use TOTP (Time-based One-Time Password)

4. **Monitor admin activity:**
   - Regularly review audit logs
   - Set up alerts for suspicious activity
   - Track failed login attempts

5. **Limit admin accounts:**
   - Only create admin accounts when necessary
   - Remove admin access when no longer needed
   - Use principle of least privilege

## API Endpoints

### Public
- `POST /api/admin/login` - Admin login

### Protected (require admin role)
- `GET /api/admin/me` - Get current admin user
- `POST /api/admin/logout` - Logout admin
- `GET /api/admin/dashboard/*` - Dashboard endpoints
- `GET /api/admin/users/*` - User management
- `GET /api/admin/kyc/*` - KYC management
- And many more...

### Protected (require super_admin role)
- `GET /api/admin/admins` - List admin users
- `POST /api/admin/admins` - Create admin user
- `PUT /api/admin/admins/{id}/role` - Update admin role
- `DELETE /api/admin/admins/{id}` - Delete admin user

## Related Files

- `app/Models/User.php` - User model with admin methods
- `app/Services/Admin/AdminAuthService.php` - Admin authentication logic
- `app/Http/Controllers/Admin/AdminAuthController.php` - Admin auth endpoints
- `app/Http/Middleware/EnsureAdmin.php` - Admin middleware
- `app/Http/Middleware/EnsureSuperAdmin.php` - Super admin middleware
- `database/seeders/AdminUserSeeder.php` - Admin user seeder
- `app/Console/Commands/CreateAdminUser.php` - Admin creation command

## Support

For issues or questions, please refer to:
- Backend README: `lepaysexpresscolis-backend/README.md`
- Admin Dashboard docs: `lepaysexpresscolis-backend/docs/ADMIN_DASHBOARD_SESSION_SUMMARY.md`
- Demo credentials: `lepaysexpresscolis-frontend/DEMO_CREDENTIALS.md`
