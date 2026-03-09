import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    // Call Laravel backend API
    const response = await apiClient.get<any>(`/api/admin/kyc/${params.id}`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to fetch KYC submission from backend:', error);
    
    return NextResponse.json(
      { error: error.message || 'KYC submission not found' },
      { status: error.status || 404 }
    );
  }
}
