import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for Laravel backend
    const params = new URLSearchParams();
    
    if (searchParams.get('page')) {
      params.append('page', searchParams.get('page')!);
    }
    if (searchParams.get('per_page')) {
      params.append('per_page', searchParams.get('per_page')!);
    }
    if (searchParams.get('rating')) {
      params.append('rating', searchParams.get('rating')!);
    }
    if (searchParams.get('type')) {
      params.append('type', searchParams.get('type')!);
    }
    if (searchParams.get('search')) {
      params.append('search', searchParams.get('search')!);
    }

    // Make request to Laravel backend
    const response = await makeAdminRequest(
      request,
      `/api/admin/ratings?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch ratings' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform backend response to match frontend expectations
    const transformed = Array.isArray(data.data) ? data.data.map((rating: any) => ({
      id: rating.id,
      reviewer: rating.from_user || { id: rating.from_user_id, name: 'Unknown', email: '' },
      reviewed_user: rating.to_user || { id: rating.to_user_id, name: 'Unknown', email: '' },
      rating: rating.rating,
      comment: rating.comment,
      type: 'for_traveler' as const,
      related_resource: {
        type: 'shipment' as const,
        id: rating.shipment_id,
        reference: rating.shipment?.tracking_number || `SHP-${rating.shipment_id}`
      },
      created_at: rating.created_at
    })) : [];

    return NextResponse.json({
      data: transformed,
      meta: {
        total: data.meta?.total || 0,
        page: data.meta?.current_page || 1,
        per_page: data.meta?.per_page || 50,
        totalPages: data.meta?.last_page || 1,
      },
    });
  } catch (error) {
    console.error('Admin ratings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
