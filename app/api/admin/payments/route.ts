import { NextRequest, NextResponse } from 'next/server';
import { mockAdminPayments } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort_by') || 'newest';

  let filtered = [...mockAdminPayments];

  if (status) {
    filtered = filtered.filter(p => p.status === status);
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
  const transformed = paginated.map(payment => ({
    id: payment.id,
    user: {
      id: payment.senderId,
      name: payment.senderName,
      email: 'sender@example.com' // Mock value
    },
    amount: payment.amount,
    stripe_payment_id: `pi_${payment.id.substring(0, 24)}`,
    method: payment.paymentMethod === 'card' ? 'card' : 'wallet',
    status: payment.status === 'escrowed' ? 'pending' : payment.status === 'released' ? 'completed' : payment.status,
    shipment: {
      id: payment.shipmentId,
      tracking_number: payment.shipmentId.substring(0, 8).toUpperCase()
    },
    created_at: payment.createdAt.toISOString(),
    completed_at: payment.releasedAt?.toISOString()
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
