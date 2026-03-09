import { NextRequest, NextResponse } from 'next/server';
import { mockAdminShipments } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort_by') || 'newest';

  let filtered = [...mockAdminShipments];

  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }

  // Sort
  if (sortBy === 'newest') {
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginated = filtered.slice(start, end);

  // Transform to snake_case for frontend
  const transformed = paginated.map(shipment => ({
    id: shipment.id,
    tracking_number: shipment.id.substring(0, 8).toUpperCase(),
    sender: {
      id: shipment.senderId,
      name: shipment.senderName,
      email: 'sender@example.com' // Mock value
    },
    recipient: {
      name: 'Recipient Name', // Mock value
      phone: '+33 6 12 34 56 78' // Mock value
    },
    weight: shipment.weight,
    price: shipment.amount,
    status: shipment.status,
    created_at: shipment.createdAt.toISOString(),
    delivery_date: shipment.status === 'delivered' ? new Date(shipment.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
  }));

  return NextResponse.json({
    data: transformed,
    meta: {
      total: filtered.length,
      page,
      per_page: perPage,
      totalPages: Math.ceil(filtered.length / perPage),
    },
  });
}
