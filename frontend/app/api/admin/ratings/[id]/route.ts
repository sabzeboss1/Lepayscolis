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
      `/api/admin/ratings/${params.id}`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Transform backend response to match frontend expectations
    const rating = data.data;
    const transformed = {
      id: rating.id,
      reviewer: rating.from_user || { id: '', name: 'Unknown', email: '', phone: '' },
      reviewed_user: {
        ...(rating.to_user || { id: '', name: 'Unknown', email: '', phone: '' }),
        average_rating: rating.to_user?.rating || 0,
        total_ratings: rating.to_user?.total_ratings || 0,
      },
      rating: rating.rating,
      comment: rating.comment,
      related_resource: rating.shipment ? {
        type: 'shipment' as const,
        id: rating.shipment.id,
        reference: rating.shipment.description || `SHP-${rating.shipment.id?.substring(0, 8)}`,
        details: rating.shipment.description || '',
      } : {
        type: 'shipment' as const,
        id: rating.shipment_id || '',
        reference: `SHP-${(rating.shipment_id || '').substring(0, 8)}`,
        details: '',
      },
      created_at: rating.created_at,
    };

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Rating not found' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const response = await makeAdminRequest(
      request,
      `/api/admin/ratings/${params.id}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: body.reason }),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to remove rating' },
      { status: 500 }
    );
  }
}
