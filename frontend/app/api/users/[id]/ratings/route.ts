import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${BACKEND_URL}/api/users/${id}/ratings`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch ratings' }));
      return NextResponse.json(
        { message: errorData.message || 'Failed to fetch ratings' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('User ratings fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
