import { NextRequest, NextResponse } from 'next/server';
import { mockAdminTrips } from '@/lib/api/adminMockData';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const body = await request.json();
  const { reason } = body;

  const trip = mockAdminTrips.find(t => t.id === params.id);

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (!reason || reason.length < 10) {
    return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 });
  }

  // Update trip status (in mock data)
  trip.status = 'cancelled';

  return NextResponse.json({
    message: 'Trip cancelled successfully',
    data: {
      trip_id: trip.id,
      status: 'cancelled',
      reason
    }
  });
}
