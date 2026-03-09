import { NextRequest, NextResponse } from 'next/server';
import { mockAdminWithdrawals } from '@/lib/api/adminMockData';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const withdrawal = mockAdminWithdrawals.find(w => w.id === params.id);

  if (!withdrawal) {
    return NextResponse.json(
      { error: 'Withdrawal not found' },
      { status: 404 }
    );
  }

  if (withdrawal.status !== 'processing') {
    return NextResponse.json(
      { error: 'Only processing withdrawals can be completed' },
      { status: 400 }
    );
  }

  // In a real app, update the withdrawal status in the database
  // For now, just return success
  return NextResponse.json({ 
    message: 'Withdrawal completed successfully',
    data: {
      id: withdrawal.id,
      status: 'completed',
      completed_at: new Date().toISOString()
    }
  });
}
