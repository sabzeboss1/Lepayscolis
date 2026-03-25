import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();
    if (searchParams.get('page')) params.append('page', searchParams.get('page')!);
    if (searchParams.get('per_page')) params.append('per_page', searchParams.get('per_page')!);

    const response = await makeAdminRequest(
      request,
      `/api/admin/notifications/history?${params.toString()}`,
      { method: 'GET' }
    );

    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch notification history', data: [], meta: { total: 0, current_page: 1, per_page: 25, last_page: 1 } },
      { status: 500 }
    );
  }
}
