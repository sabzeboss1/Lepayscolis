import { NextRequest, NextResponse } from 'next/server';
import { mockUsers } from '@/lib/api/mockData';

// Use first mock user as authenticated user
const mockAuthenticatedUser = mockUsers[0];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate token (mock validation)
    if (!token.startsWith('mock-token-')) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Return user data
    return NextResponse.json({
      user: mockAuthenticatedUser,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
