# API Client and Mock Data

This directory contains the API client utility and mock data generators for the LePaysExpressColis frontend application.

## API Client (`client.ts`)

The `ApiClient` class provides a type-safe wrapper around the Fetch API with the following features:

### Features

- **Authentication**: Automatically injects auth tokens from cookies
- **Error Handling**: Custom `ApiError` class with status codes and error messages
- **Retry Logic**: Automatic retry with exponential backoff for network errors (default: 3 retries)
- **Type Safety**: Full TypeScript support with generic return types

### Usage

```typescript
import { apiClient } from '@/lib/api/client';

// GET request
const trips = await apiClient.get<{ trips: Trip[] }>('/trips', {
  departure: 'Moscow',
  arrival: 'Dakar'
});

// POST request
const newTrip = await apiClient.post<{ trip: Trip }>('/trips', {
  departure: { city: 'Moscow', country: 'Russia', date: new Date() },
  arrival: { city: 'Dakar', country: 'Senegal', date: new Date() },
  availableCapacity: 20,
  pricePerKg: 25
});

// PUT request
const updatedTrip = await apiClient.put<{ trip: Trip }>(`/trips/${id}`, {
  availableCapacity: 15
});

// DELETE request
await apiClient.delete(`/trips/${id}`);

// PATCH request
await apiClient.patch(`/messages/${id}/read`);
```

### Error Handling

```typescript
import { ApiError } from '@/lib/api/client';

try {
  const data = await apiClient.get('/trips');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Redirect to login
    } else if (error.status === 403) {
      // Show KYC required message
    } else {
      // Show generic error
      console.error(error.message);
    }
  }
}
```

## Mock Data (`mockData.ts`)

Mock data generators using `@faker-js/faker` for development and testing.

### Generators

- `generateMockUser(overrides?)`: Generate a mock user
- `generateMockTrip(overrides?)`: Generate a mock trip
- `generateMockShipment(overrides?)`: Generate a mock shipment
- `generateMockMessage(overrides?)`: Generate a mock message
- `generateMockRating(overrides?)`: Generate a mock rating

### Pre-generated Data

- `mockUsers`: Array of 20 mock users
- `mockTrips`: Array of 30 mock trips
- `mockShipments`: Array of 25 mock shipments
- `mockMessages`: Array of 50 mock messages
- `mockRatings`: Array of 40 mock ratings

### Usage

```typescript
import { generateMockUser, mockTrips } from '@/lib/api/mockData';

// Generate a custom user
const user = generateMockUser({
  email: 'custom@example.com',
  kycStatus: 'approved',
  rating: 4.8
});

// Use pre-generated data
const allTrips = mockTrips;
```

## Mock API Routes

All mock API routes are implemented in `app/api/` and follow RESTful conventions.

### Authentication Routes

- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user info

### Trip Routes

- `GET /api/trips` - List trips with optional filters (departure, arrival, dateFrom, dateTo, minCapacity)
- `POST /api/trips` - Create new trip (requires auth)
- `GET /api/trips/[id]` - Get trip by ID
- `PUT /api/trips/[id]` - Update trip (requires auth)
- `GET /api/trips/my` - Get current user's trips (requires auth)

### Shipment Routes

- `GET /api/shipments` - List shipments with optional filters (status, senderId, travelerId, pickupCity, deliveryCity)
- `POST /api/shipments` - Create new shipment (requires auth)
- `GET /api/shipments/[id]` - Get shipment by ID
- `PUT /api/shipments/[id]` - Update shipment (requires auth)

### Message Routes

- `GET /api/messages/conversations` - List conversations for current user (requires auth)
- `GET /api/messages/[conversationId]` - Get messages in a conversation (requires auth)
- `POST /api/messages` - Send new message (requires auth)
- `PATCH /api/messages/[id]/read` - Mark message as read (requires auth)

## Authentication

The mock API uses a simple token-based authentication:

1. Login or register returns a token in the response
2. Store the token in cookies as `auth-token`
3. The API client automatically includes the token in subsequent requests
4. Protected routes check for the `Authorization: Bearer <token>` header

### Example Login Flow

```typescript
// Login
const { token, user } = await apiClient.post('/auth/login', {
  email: 'test@example.com',
  password: 'password123'
});

// Store token in cookie
document.cookie = `auth-token=${token}; path=/`;

// Subsequent requests automatically include the token
const trips = await apiClient.get('/trips/my');
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 18.2**: API error handling with user-friendly messages
- **Requirement 18.4**: Network error recovery with retry logic

## Notes

- All data is stored in-memory and will reset on server restart
- The mock API is for development only and should be replaced with real backend integration
- Date objects in responses are serialized as ISO strings by Next.js
- The first user in `mockUsers` is used as the authenticated user for testing
