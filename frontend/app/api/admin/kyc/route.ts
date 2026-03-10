import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query parameters for backend
    const params = new URLSearchParams();
    
    if (searchParams.get('page')) params.append('page', searchParams.get('page')!);
    if (searchParams.get('per_page')) params.append('per_page', searchParams.get('per_page')!);
    if (searchParams.get('status')) params.append('status', searchParams.get('status')!);
    if (searchParams.get('sort_by')) params.append('sort_by', searchParams.get('sort_by')!);

    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      `/api/admin/kyc?${params.toString()}`,
      { method: 'GET' }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch KYC submissions from backend:', error);
    
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch KYC submissions',
        data: [],
        meta: {
          total: 0,
          page: 1,
          per_page: 10,
          totalPages: 0
        }
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
