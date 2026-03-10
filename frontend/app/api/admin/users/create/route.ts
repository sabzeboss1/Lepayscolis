import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return await makeAdminRequest(
      request,
      '/api/admin/users',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
