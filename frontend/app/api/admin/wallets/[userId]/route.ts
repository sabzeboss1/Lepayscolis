import { NextRequest, NextResponse } from 'next/server';
import { mockAdminWallets, mockAdminUsers } from '@/lib/api/adminMockData';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const params = await context.params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '25');

  const wallet = mockAdminWallets.find(w => w.userId === params.userId);
  const user = mockAdminUsers.find(u => u.id === params.userId);

  if (!wallet || !user) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  // Generate mock transactions
  const allTransactions = [
    {
      id: '1',
      type: 'credit' as const,
      amount: 150.00,
      description: 'Payment received for shipment delivery',
      reference_type: 'shipment',
      reference_id: 'ship-001',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'debit' as const,
      amount: 50.00,
      description: 'Withdrawal to bank account',
      reference_type: 'withdrawal',
      reference_id: 'wd-001',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'adjustment' as const,
      amount: 25.00,
      description: 'Admin adjustment - Compensation for service issue',
      reference_type: null,
      reference_id: null,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const total = allTransactions.length;
  const start = (page - 1) * perPage;
  const transactions = allTransactions.slice(start, start + perPage);

  return NextResponse.json({
    data: {
      wallet: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        balance: wallet.balance,
        total_credits: wallet.totalEarned,
        total_debits: wallet.totalWithdrawn,
        total_adjustments: 0 // Not tracked in mock data
      },
      transactions
    },
    meta: {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.ceil(total / perPage)
    }
  });
}
