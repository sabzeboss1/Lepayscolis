import { NextRequest, NextResponse } from 'next/server';
import { mockAdminWithdrawals } from '@/lib/api/adminMockData';

export async function GET(
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

  // Transform to snake_case for frontend
  const transformed = {
    id: withdrawal.id,
    user_id: withdrawal.userId,
    user_name: withdrawal.userName,
    user_email: withdrawal.userEmail,
    amount: withdrawal.amount,
    method: withdrawal.method,
    account_details: withdrawal.accountDetails,
    status: withdrawal.status,
    requested_at: withdrawal.requestedAt.toISOString(),
    processed_at: withdrawal.processedAt?.toISOString(),
    processed_by: withdrawal.processedBy,
    rejection_reason: withdrawal.rejectionReason
  };

  return NextResponse.json({ data: transformed });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const body = await request.json();
  const withdrawal = mockAdminWithdrawals.find(w => w.id === params.id);

  if (!withdrawal) {
    return NextResponse.json(
      { error: 'Withdrawal not found' },
      { status: 404 }
    );
  }

  // In a real app, update the withdrawal status in the database
  // For now, just return success
  return NextResponse.json({ message: 'Withdrawal updated successfully' });
}
