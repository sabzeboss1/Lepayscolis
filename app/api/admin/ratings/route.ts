import { NextRequest, NextResponse } from 'next/server';
import { mockAdminRatings } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const flagged = searchParams.get('flagged');
  const sortBy = searchParams.get('sort_by') || 'newest';

  let filtered = [...mockAdminRatings];

  if (flagged === 'true') {
    filtered = filtered.filter(r => r.flagged);
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
  const transformed = paginated.map(rating => ({
    id: rating.id,
    reviewer: {
      id: rating.fromUserId,
      name: rating.fromUserName,
      email: 'reviewer@example.com'
    },
    reviewed_user: {
      id: rating.toUserId,
      name: rating.toUserName,
      email: 'reviewed@example.com'
    },
    rating: rating.rating,
    comment: rating.comment,
    type: 'for_traveler' as const,
    related_resource: {
      type: 'shipment' as const,
      id: rating.shipmentId,
      reference: rating.shipmentId.substring(0, 8).toUpperCase()
    },
    created_at: rating.createdAt.toISOString()
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
