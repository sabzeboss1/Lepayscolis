import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '20';

    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      `/api/admin/dashboard/activity?limit=${limit}`,
      { method: 'GET' }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch dashboard activity:', error);
    
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch dashboard activity',
        data: []
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
