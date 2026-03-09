import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call Laravel backend API
    const response = await apiClient.post<any>('/api/admin/kyc/bulk-reject', body);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to bulk reject KYC:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to bulk reject KYC' },
      { status: error.status || 500 }
    );
  }
}
