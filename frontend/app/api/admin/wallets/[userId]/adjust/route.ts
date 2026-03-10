import { NextRequest, NextResponse } from 'next/server';
import { mockAdminWallets } from '@/lib/api/adminMockData';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const params = await context.params;
  const body = await request.json();
  const { amount, reason } = body;

  const wallet = mockAdminWallets.find(w => w.userId === params.userId);

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  if (!amount || amount === 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  if (!reason || reason.length < 10) {
    return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 });
  }

  // Update wallet balance (in mock data)
  wallet.balance += amount;
  wallet.totalEarned += amount > 0 ? amount : 0;
  wallet.totalWithdrawn += amount < 0 ? Math.abs(amount) : 0;

  return NextResponse.json({
    message: 'Balance adjusted successfully',
    data: {
      new_balance: wallet.balance,
      adjustment_amount: amount,
      reason
    }
  });
}
