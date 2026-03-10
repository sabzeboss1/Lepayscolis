import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      `/api/admin/kyc/${params.id}`,
      { method: 'GET' }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch KYC submission from backend:', error);
    
    return NextResponse.json(
      { message: error.message || 'KYC submission not found' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}
