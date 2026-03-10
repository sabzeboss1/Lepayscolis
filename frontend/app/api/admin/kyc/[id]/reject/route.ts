import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      `/api/admin/kyc/${params.id}/reject`,
      { 
        method: 'POST',
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to reject KYC:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to reject KYC' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
