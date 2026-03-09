import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    // Call Laravel backend API
    const response = await apiClient.get<any>(`/api/admin/users/${params.id}`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to fetch user details from backend:', error);
    
    return NextResponse.json(
      { error: error.message || 'User not found' },
      { status: error.status || 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    // Call Laravel backend API
    const response = await apiClient.put<any>(`/api/admin/users/${params.id}`, body);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    // Call Laravel backend API
    const response = await apiClient.delete<any>(`/api/admin/users/${params.id}`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: error.status || 500 }
    );
  }
}
