import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 [Admin Logout API] Received logout request');
    
    const token = request.cookies.get('admin-token')?.value;

    if (token) {
      console.log('🔑 [Admin Logout API] Token found, calling backend logout');
      
      // Forward request to Laravel backend
      await fetch(`${BACKEND_URL}/api/admin/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(err => {
        console.error('⚠️ [Admin Logout API] Backend logout failed:', err);
        // Continue anyway - we'll clear the cookie
      });
    }

    // Create response and clear admin-token cookie
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    
    console.log('🍪 [Admin Logout API] Clearing admin-token cookie');
    response.cookies.delete('admin-token');

    console.log('✅ [Admin Logout API] Logout successful');
    return response;
  } catch (error) {
    console.error('❌ [Admin Logout API] Error:', error);
    
    // Even on error, clear the cookie
    const response = NextResponse.json(
      { message: 'Logged out' },
      { status: 200 }
    );
    response.cookies.delete('admin-token');
    
    return response;
  }
}
