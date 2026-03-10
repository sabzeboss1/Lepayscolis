import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for Laravel backend
    const params = new URLSearchParams();
    if (searchParams.get('page')) params.set('page', searchParams.get('page')!);
    if (searchParams.get('per_page')) params.set('per_page', searchParams.get('per_page')!);
    if (searchParams.get('search')) params.set('search', searchParams.get('search')!);
    if (searchParams.get('sort_by')) params.set('sort_by', searchParams.get('sort_by')!);

    // Make authenticated request to Laravel backend
    const response = await makeAdminRequest(
      request,
      `/api/admin/wallets?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to fetch wallets' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform Laravel response to match frontend expectations
    const transformed = {
      data: Array.isArray(data.data) ? data.data.map((wallet: any) => ({
        id: wallet.id,
        user: {
          id: wallet.user.id,
          name: wallet.user.name,
          email: wallet.user.email,
          phone: wallet.user.phone || 'N/A'
        },
        balance: wallet.balance,
        total_credits: wallet.total_credits || 0,
        total_debits: wallet.total_debits || 0,
        last_transaction_at: wallet.last_transaction_at || null
      })) : [],
      meta: {
        total: data.meta?.total || 0,
        page: data.meta?.current_page || 1,
        per_page: data.meta?.per_page || 50,
        totalPages: data.meta?.last_page || 1
      }
    };

    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error('Admin wallets API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
