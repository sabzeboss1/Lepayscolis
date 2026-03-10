import { NextRequest, NextResponse } from 'next/server';
import { mockTrips } from '@/lib/api/mockData';

// In-memory storage (shared with main trips route)
const allTrips = [...mockTrips];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trip = allTrips.find(t => t.id === id);

    if (!trip) {
      return NextResponse.json(
        { message: 'Trip not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      trip,
    });
  } catch (error) {
    console.error('Get trip error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tripIndex = allTrips.findIndex(t => t.id === id);

    if (tripIndex === -1) {
      return NextResponse.json(
        { message: 'Trip not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      departure,
      arrival,
      availableCapacity,
      pricePerKg,
      status,
    } = body;

    // Update trip
    const updatedTrip = {
      ...allTrips[tripIndex],
      ...(departure && { departure }),
      ...(arrival && { arrival }),
      ...(availableCapacity !== undefined && { availableCapacity }),
      ...(pricePerKg !== undefined && { pricePerKg }),
      ...(status && { status }),
    };

    allTrips[tripIndex] = updatedTrip;

    return NextResponse.json({
      trip: updatedTrip,
    });
  } catch (error) {
    console.error('Update trip error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
