import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    // Call Laravel backend API
    const response = await apiClient.post<any>(`/api/admin/kyc/${params.id}/approve`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to approve KYC:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to approve KYC' },
      { status: error.status || 500 }
    );
  }
}
