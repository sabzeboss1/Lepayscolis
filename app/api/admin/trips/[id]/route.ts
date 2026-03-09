import { NextRequest, NextResponse } from 'next/server';
import { mockAdminTrips, mockAdminShipments, mockAdminUsers } from '@/lib/api/adminMockData';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const trip = mockAdminTrips.find(t => t.id === params.id);

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    );
  }

  const traveler = mockAdminUsers.find(u => u.id === trip.travelerId);

  // Get shipments for this trip
  const tripShipments = mockAdminShipments
    .filter(s => s.tripId === params.id)
    .map(s => ({
      id: s.id,
      tracking_number: s.id.substring(0, 8).toUpperCase(),
      sender_name: s.senderName,
      recipient_name: 'Recipient', // Not in mock data
      weight: s.weight,
      status: s.status,
      price: s.amount
    }));

  // Calculate analytics
  const totalRevenue = tripShipments.reduce((sum, s) => sum + s.price, 0);
  const completedShipments = tripShipments.filter(s => s.status === 'delivered').length;

  // Transform to snake_case for frontend
  const transformed = {
    id: trip.id,
    traveler: {
      id: trip.travelerId,
      name: trip.travelerName,
      email: trip.travelerEmail,
      phone: traveler?.phone || 'N/A'
    },
    origin: `${trip.departure.city}, ${trip.departure.country}`,
    destination: `${trip.arrival.city}, ${trip.arrival.country}`,
    departure_date: trip.departure.date.toISOString(),
    arrival_date: trip.arrival.date.toISOString(),
    available_space: trip.availableCapacity,
    price_per_kg: trip.pricePerKg,
    status: trip.status === 'active' ? 'upcoming' : trip.status,
    created_at: trip.createdAt.toISOString()
  };

  return NextResponse.json({
    data: {
      trip: transformed,
      shipments: tripShipments,
      analytics: {
        total_shipments: tripShipments.length,
        total_revenue: totalRevenue,
        completion_rate: tripShipments.length > 0 ? (completedShipments / tripShipments.length) * 100 : 0,
        average_rating: 4.5 // Mock value
      }
    }
  });
}
