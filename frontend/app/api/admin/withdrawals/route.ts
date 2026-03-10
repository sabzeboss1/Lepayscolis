import { NextRequest, NextResponse } from 'next/server';
import { mockAdminWithdrawals } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort_by') || 'newest';

  let filtered = [...mockAdminWithdrawals];

  if (status) {
    filtered = filtered.filter(w => w.status === status);
  }

  // Sort
  if (sortBy === 'newest') {
    filtered.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime());
  }

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginated = filtered.slice(start, end);

  // Transform to snake_case for frontend
  const transformed = paginated.map(withdrawal => ({
    id: withdrawal.id,
    user: {
      id: withdrawal.userId,
      name: withdrawal.userName,
      email: withdrawal.userEmail
    },
    amount: withdrawal.amount,
    fee: withdrawal.amount * 0.02, // Mock 2% fee
    net_amount: withdrawal.amount * 0.98,
    bank_details: {
      account_holder: withdrawal.userName,
      bank_name: 'Mock Bank',
      account_number: withdrawal.accountDetails,
      iban: withdrawal.accountDetails,
      swift_code: 'MOCKSWIFT'
    },
    status: withdrawal.status,
    requested_at: withdrawal.requestedAt.toISOString(),
    approved_at: withdrawal.status === 'approved' ? withdrawal.processedAt?.toISOString() : undefined,
    completed_at: withdrawal.status === 'completed' ? withdrawal.processedAt?.toISOString() : undefined,
    rejected_at: withdrawal.status === 'rejected' ? withdrawal.processedAt?.toISOString() : undefined,
    rejection_reason: withdrawal.rejectionReason
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
