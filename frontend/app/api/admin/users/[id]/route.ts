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
      `/api/admin/users/${params.id}`,
      { method: 'GET' }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch user details from backend:', error);
    
    return NextResponse.json(
      { message: error.message || 'User not found' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
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
    
    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      `/api/admin/users/${params.id}`,
      { 
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to update user' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      `/api/admin/users/${params.id}`,
      { method: 'DELETE' }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to delete user' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
