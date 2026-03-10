import { NextRequest, NextResponse } from 'next/server';
import { mockTrips, mockUsers, demoTripsForNewUser } from '@/lib/api/mockData';

// In-memory storage (shared with main trips route)
const allTrips = [...mockTrips, ...demoTripsForNewUser];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract user ID from token (mock implementation)
    const token = authHeader.substring(7);
    // Token format: mock-token-{userId}-{timestamp}
    const tokenParts = token.split('-');
    const userId = tokenParts.length >= 3 ? tokenParts.slice(2, -1).join('-') : mockUsers[0].id;

    // Filter trips by user
    const userTrips = allTrips.filter(trip => trip.travelerId === userId);

    return NextResponse.json({
      trips: userTrips,
      total: userTrips.length,
    });
  } catch (error) {
    console.error('Get my trips error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
