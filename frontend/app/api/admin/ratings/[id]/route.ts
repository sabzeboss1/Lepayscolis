import { NextRequest, NextResponse } from 'next/server';
import { mockAdminRatings } from '@/lib/api/adminMockData';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const rating = mockAdminRatings.find(r => r.id === params.id);

  if (!rating) {
    return NextResponse.json(
      { error: 'Rating not found' },
      { status: 404 }
    );
  }

  // Transform to snake_case for frontend
  const transformed = {
    id: rating.id,
    from_user_id: rating.fromUserId,
    from_user_name: rating.fromUserName,
    to_user_id: rating.toUserId,
    to_user_name: rating.toUserName,
    shipment_id: rating.shipmentId,
    rating: rating.rating,
    comment: rating.comment,
    flagged: rating.flagged,
    created_at: rating.createdAt.toISOString()
  };

  return NextResponse.json({ data: transformed });
}
