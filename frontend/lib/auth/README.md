# Authentication System

This directory contains the authentication system for LePaysExpressColis frontend.

## Components

### AuthContext.tsx
Provides authentication state and methods throughout the application using React Context.

**Features:**
- User authentication state management
- Login, register, and logout functions
- Token storage in cookies
- Automatic authentication check on mount
- Session persistence across browser restarts

**Usage:**
```tsx
import { useAuth } from '@/lib/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <div>Welcome, {user.name}!</div>;
}
```

## Authentication Flow

### Registration
1. User fills registration form with name, email, phone, password
2. Form validates input using Zod schema
3. POST request to `/api/auth/register`
4. On success, token stored in cookie and user redirected to dashboard

### Login
1. User enters email and password
2. Form validates input using Zod schema
3. POST request to `/api/auth/login`
4. On success, token stored in cookie and user redirected to dashboard

### Session Persistence
1. On app mount, AuthProvider checks for `auth-token` cookie
2. If token exists, GET request to `/api/auth/me` to fetch user data
3. User state populated if token is valid
4. Invalid tokens are cleared automatically

### Logout
1. User clicks logout button
2. POST request to `/api/auth/logout`
3. Token cookie deleted
4. User state cleared
5. User redirected to home page

## Route Protection

The `middleware.ts` file protects routes:

**Protected Routes (require authentication):**
- `/dashboard`
- `/travel/*`
- `/shipment/*`
- `/messages/*`
- `/profile/*`
- `/ratings/*`

**Auth Routes (redirect if authenticated):**
- `/auth/login`
- `/auth/register`

## Mock API

For development, mock API routes are provided:

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/register` - Create new user
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user

**Test Credentials:**
- Email: `test@example.com`
- Password: `password123`

## Cookie Management

Authentication tokens are stored in cookies with:
- Name: `auth-token`
- Expiry: 7 days
- Path: `/`
- SameSite: `Lax`

## Error Handling

All authentication functions throw errors that should be caught and displayed to users:

```tsx
try {
  await login(email, password);
} catch (error) {
  setError(error.message);
}
```

## Testing

Unit tests are provided in `__tests__/AuthContext.test.tsx`:
- Initial state without token
- Login functionality
- Error handling
- Context usage validation
