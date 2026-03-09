import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call Laravel backend API
    const response = await apiClient.post<any>('/api/admin/kyc/bulk-approve', body);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to bulk approve KYC:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to bulk approve KYC' },
      { status: error.status || 500 }
    );
  }
}
