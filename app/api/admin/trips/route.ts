import { NextRequest, NextResponse } from 'next/server';
import { mockAdminTrips } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort_by') || 'newest';

  let filtered = [...mockAdminTrips];

  if (status) {
    filtered = filtered.filter(t => t.status === status);
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
  const transformed = paginated.map(trip => ({
    id: trip.id,
    traveler: {
      id: trip.travelerId,
      name: trip.travelerName,
      email: trip.travelerEmail
    },
    origin: `${trip.departure.city}, ${trip.departure.country}`,
    destination: `${trip.arrival.city}, ${trip.arrival.country}`,
    departure_date: trip.departure.date.toISOString(),
    arrival_date: trip.arrival.date.toISOString(),
    available_space: trip.availableCapacity,
    price_per_kg: trip.pricePerKg,
    status: trip.status === 'active' ? 'upcoming' : trip.status,
    shipments_count: 0, // Mock value
    created_at: trip.createdAt.toISOString()
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
