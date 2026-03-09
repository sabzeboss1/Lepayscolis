import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for backend
    const params: Record<string, string> = {};
    
    if (searchParams.get('page')) params.page = searchParams.get('page')!;
    if (searchParams.get('per_page')) params.per_page = searchParams.get('per_page')!;
    if (searchParams.get('status')) params.status = searchParams.get('status')!;
    if (searchParams.get('sort_by')) params.sort_by = searchParams.get('sort_by')!;

    // Call Laravel backend API
    const response = await apiClient.get<any>('/api/admin/kyc', { params });
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to fetch KYC submissions from backend:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch KYC submissions',
        data: [],
        meta: {
          total: 0,
          page: 1,
          per_page: 10,
          totalPages: 0
        }
      },
      { status: error.status || 500 }
    );
  }
}
