import { NextRequest, NextResponse } from 'next/server';
import { mockAdminWallets } from '@/lib/api/adminMockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginated = mockAdminWallets.slice(start, end);

  // Transform to snake_case for frontend
  const transformed = paginated.map(wallet => ({
    id: wallet.id,
    user: {
      id: wallet.userId,
      name: wallet.userName,
      email: wallet.userEmail,
      phone: 'N/A' // Mock value
    },
    balance: wallet.balance,
    total_credits: wallet.totalEarned,
    total_debits: wallet.totalWithdrawn,
    last_transaction_at: wallet.lastTransaction?.toISOString()
  }));

  return NextResponse.json({
    data: transformed,
    meta: {
      total: mockAdminWallets.length,
      page,
      per_page: perPage,
      totalPages: Math.ceil(mockAdminWallets.length / perPage),
    },
  });
}
