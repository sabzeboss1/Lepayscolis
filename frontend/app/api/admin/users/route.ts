import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for backend
    const params = new URLSearchParams();
    
    if (searchParams.get('page')) params.append('page', searchParams.get('page')!);
    if (searchParams.get('per_page')) params.append('per_page', searchParams.get('per_page')!);
    if (searchParams.get('search')) params.append('search', searchParams.get('search')!);
    if (searchParams.get('status')) params.append('status', searchParams.get('status')!);
    if (searchParams.get('role')) params.append('role', searchParams.get('role')!);
    if (searchParams.get('kyc_status')) params.append('kyc_status', searchParams.get('kyc_status')!);
    if (searchParams.get('sort_by')) params.append('sort_by', searchParams.get('sort_by')!);
    if (searchParams.get('sort_direction')) params.append('sort_direction', searchParams.get('sort_direction')!);

    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      `/api/admin/users?${params.toString()}`,
      { method: 'GET' }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch users from backend:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch users',
        data: [],
        meta: {
          total: 0,
          page: 1,
          per_page: 50,
          total_pages: 0
        }
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
