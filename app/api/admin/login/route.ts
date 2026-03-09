import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [Admin Login API] Received login request');
    
    const body = await request.json();
    const { email, password } = body;

    console.log('📧 [Admin Login API] Email:', email);
    console.log('🌐 [Admin Login API] Backend URL:', `${BACKEND_URL}/api/admin/login`);

    // Forward request to Laravel backend
    const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 [Admin Login API] Backend response status:', response.status);

    const data = await response.json();
    console.log('📦 [Admin Login API] Backend response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ [Admin Login API] Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Create response with token in cookie
    const nextResponse = NextResponse.json(data, { status: 200 });
    
    // Set admin-token cookie for middleware
    if (data.token) {
      console.log('🍪 [Admin Login API] Setting admin-token cookie');
      nextResponse.cookies.set('admin-token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    console.log('✅ [Admin Login API] Login successful');
    return nextResponse;
  } catch (error) {
    console.error('❌ [Admin Login API] Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
