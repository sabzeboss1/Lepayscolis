import { NextRequest, NextResponse } from 'next/server';
import { mockAdminShipments, mockAdminTrips, mockAdminUsers } from '@/lib/api/adminMockData';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const shipment = mockAdminShipments.find(s => s.id === params.id);

  if (!shipment) {
    return NextResponse.json(
      { error: 'Shipment not found' },
      { status: 404 }
    );
  }

  const sender = mockAdminUsers.find(u => u.id === shipment.senderId);
  const traveler = mockAdminUsers.find(u => u.id === shipment.travelerId);
  const trip = mockAdminTrips.find(t => t.id === shipment.tripId);

  // Transform to snake_case for frontend
  const transformed = {
    id: shipment.id,
    tracking_number: shipment.id.substring(0, 8).toUpperCase(),
    sender: {
      id: shipment.senderId,
      name: shipment.senderName,
      email: sender?.email || 'N/A',
      phone: sender?.phone || 'N/A'
    },
    recipient: {
      name: 'Recipient Name', // Not in mock data
      phone: '+33 6 12 34 56 78',
      address: trip ? `${trip.arrival.city}, ${trip.arrival.country}` : 'N/A'
    },
    package_details: {
      description: shipment.description,
      weight: shipment.weight,
      dimensions: '30x20x15 cm',
      value: shipment.amount
    },
    trip: {
      id: shipment.tripId,
      origin: trip ? `${trip.departure.city}, ${trip.departure.country}` : 'N/A',
      destination: trip ? `${trip.arrival.city}, ${trip.arrival.country}` : 'N/A',
      traveler_name: shipment.travelerName
    },
    payment: {
      amount: shipment.amount,
      status: shipment.paymentStatus,
      method: 'card'
    },
    status: shipment.status,
    status_history: [
      {
        status: 'pending',
        timestamp: shipment.createdAt.toISOString(),
        note: 'Shipment created'
      },
      ...(shipment.status !== 'pending' ? [{
        status: shipment.status,
        timestamp: new Date(shipment.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        note: `Status updated to ${shipment.status}`
      }] : [])
    ],
    created_at: shipment.createdAt.toISOString(),
    delivery_date: shipment.status === 'delivered' ? new Date(shipment.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
  };

  return NextResponse.json({
    data: {
      shipment: transformed,
      analytics: {
        delivery_time_days: 7,
        on_time_delivery: true
      }
    }
  });
}
