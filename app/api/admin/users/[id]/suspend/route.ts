import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    // Call Laravel backend API
    const response = await apiClient.post<any>(`/api/admin/users/${params.id}/suspend`, body);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to suspend user:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to suspend user' },
      { status: error.status || 500 }
    );
  }
}
