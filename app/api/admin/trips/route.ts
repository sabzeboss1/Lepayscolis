import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for Laravel backend
    const params = new URLSearchParams();
    if (searchParams.get('page')) params.set('page', searchParams.get('page')!);
    if (searchParams.get('per_page')) params.set('per_page', searchParams.get('per_page')!);
    if (searchParams.get('search')) params.set('search', searchParams.get('search')!);
    if (searchParams.get('status')) params.set('status', searchParams.get('status')!);
    if (searchParams.get('sort_by')) params.set('sort_by', searchParams.get('sort_by')!);

    // Make authenticated request to Laravel backend
    const response = await makeAdminRequest(
      request,
      `/api/admin/trips?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to fetch trips' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform Laravel response to match frontend expectations
    const transformed = {
      data: data.data.map((trip: any) => ({
        id: trip.id,
        traveler: {
          id: trip.traveler.id,
          name: trip.traveler.name,
          email: trip.traveler.email
        },
        origin: trip.origin,
        destination: trip.destination,
        departure_date: trip.departure_date,
        arrival_date: trip.arrival_date,
        available_space: trip.available_space,
        price_per_kg: trip.price_per_kg,
        status: trip.status,
        shipments_count: trip.shipments_count || 0,
        created_at: trip.created_at
      })),
      meta: {
        total: data.meta.total,
        page: data.meta.current_page,
        per_page: data.meta.per_page,
        totalPages: data.meta.last_page
      }
    };

    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error('Admin trips API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
