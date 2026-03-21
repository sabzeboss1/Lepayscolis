import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Forward all query parameters to Laravel backend
    const params = new URLSearchParams();
    const forwardParams = ['page', 'per_page', 'status', 'method', 'date_from', 'date_to', 'sort_by', 'sort_direction'];
    forwardParams.forEach(key => {
      const value = searchParams.get(key);
      if (value) params.append(key, value);
    });

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

    return NextResponse.json({
      data: data.data || [],
      meta: {
        total: data.meta?.total || 0,
        current_page: data.meta?.current_page || 1,
        per_page: data.meta?.per_page || 50,
        last_page: data.meta?.last_page || 1,
      },
    });
  } catch (error: any) {
    console.error('Admin payments API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
