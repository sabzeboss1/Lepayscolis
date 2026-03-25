import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await makeAdminRequest(
      request,
      `/api/admin/trips/${params.id}`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Transform the response to match frontend expectations
    const raw = data.data;
    const trip = raw.trip;

    const transformed = {
      data: {
        trip: {
          id: trip.id,
          traveler: {
            id: trip.traveler?.id,
            name: trip.traveler?.name,
            email: trip.traveler?.email,
            phone: trip.traveler?.phone,
          },
          origin: trip.origin,
          destination: trip.destination,
          departure_date: trip.departure_date,
          arrival_date: trip.arrival_date,
          available_space: trip.available_capacity ?? trip.available_space,
          price_per_kg: trip.price_per_kg,
          currency_code: trip.currency_code,
          status: trip.status,
          verification_status: trip.verification_status,
          cancellation_reason: trip.cancellation_reason,
          rejection_reason: trip.rejection_reason,
          verified_by: trip.verified_by,
          verified_at: trip.verified_at,
          travel_proof_url: trip.travel_proof_url,
          created_at: trip.created_at,
          updated_at: trip.updated_at,
        },
        shipments: raw.shipments ?? [],
        analytics: raw.analytics ?? null,
        timeline: raw.timeline ?? [],
      },
    };

    return NextResponse.json(transformed);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Trip not found' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}
