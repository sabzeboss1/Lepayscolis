import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for backend
    const params: Record<string, string> = {};
    
    if (searchParams.get('page')) params.page = searchParams.get('page')!;
    if (searchParams.get('per_page')) params.per_page = searchParams.get('per_page')!;
    if (searchParams.get('search')) params.search = searchParams.get('search')!;
    if (searchParams.get('status')) params.status = searchParams.get('status')!;
    if (searchParams.get('role')) params.role = searchParams.get('role')!;
    if (searchParams.get('kyc_status')) params.kyc_status = searchParams.get('kyc_status')!;
    if (searchParams.get('sort_by')) params.sort_by = searchParams.get('sort_by')!;
    if (searchParams.get('sort_direction')) params.sort_direction = searchParams.get('sort_direction')!;

    // Call Laravel backend API
    const response = await apiClient.get<any>('/api/admin/users', { params });
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to fetch users from backend:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch users',
        data: [],
        meta: {
          total: 0,
          page: 1,
          per_page: 50,
          total_pages: 0
        }
      },
      { status: error.status || 500 }
    );
  }
}
