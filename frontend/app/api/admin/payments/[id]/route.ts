import { NextRequest, NextResponse } from 'next/server';
import { mockAdminPayments } from '@/lib/api/adminMockData';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const payment = mockAdminPayments.find(p => p.id === params.id);

  if (!payment) {
    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );
  }

  // Transform to snake_case for frontend
  const transformed = {
    id: payment.id,
    shipment_id: payment.shipmentId,
    sender_id: payment.senderId,
    sender_name: payment.senderName,
    traveler_id: payment.travelerId,
    traveler_name: payment.travelerName,
    amount: payment.amount,
    platform_fee: payment.platformFee,
    status: payment.status,
    payment_method: payment.paymentMethod,
    created_at: payment.createdAt.toISOString(),
    released_at: payment.releasedAt?.toISOString()
  };

  return NextResponse.json({ data: transformed });
}
