import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      '/api/admin/kyc/bulk-reject',
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
    console.error('Failed to bulk reject KYC:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to bulk reject KYC' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
