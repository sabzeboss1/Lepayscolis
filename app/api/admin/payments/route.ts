import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for Laravel backend
    const params = new URLSearchParams();
    
    if (searchParams.get('page')) {
      params.append('page', searchParams.get('page')!);
    }
    if (searchParams.get('per_page')) {
      params.append('per_page', searchParams.get('per_page')!);
    }
    if (searchParams.get('status')) {
      params.append('status', searchParams.get('status')!);
    }
    if (searchParams.get('method')) {
      params.append('method', searchParams.get('method')!);
    }
    if (searchParams.get('date_from')) {
      params.append('date_from', searchParams.get('date_from')!);
    }
    if (searchParams.get('date_to')) {
      params.append('date_to', searchParams.get('date_to')!);
    }

    // Make request to Laravel backend
    const response = await makeAdminRequest(
      request,
      `/api/admin/payments?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch payments' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform backend response to match frontend expectations
    const transformed = Array.isArray(data.data) ? data.data.map((payment: any) => ({
      id: payment.id,
      user: payment.user,
      amount: payment.amount,
      stripe_payment_id: payment.stripe_payment_intent_id || '',
      method: payment.payment_method,
      status: payment.status,
      shipment: payment.shipment || null,
      created_at: payment.created_at,
      completed_at: payment.updated_at
    })) : [];

    return NextResponse.json({
      data: transformed,
      meta: {
        total: data.meta?.total || 0,
        page: data.meta?.current_page || 1,
        per_page: data.meta?.per_page || 50,
        totalPages: data.meta?.last_page || 1,
      },
    });
  } catch (error) {
    console.error('Admin payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
