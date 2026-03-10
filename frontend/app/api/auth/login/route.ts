import { NextRequest, NextResponse } from 'next/server';
import { mockUsers } from '@/lib/api/mockData';

// Mock password storage (in real app, passwords would be hashed)
const mockPasswords: Record<string, string> = {
  'demo@lepaysexpresscolis.com': 'demo123',
  'traveler@lepaysexpresscolis.com': 'demo123',
  'sender@lepaysexpresscolis.com': 'demo123',
  'newuser@lepaysexpresscolis.com': 'demo123',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = mockUsers.find((u) => u.email === email);

    if (!user || mockPasswords[email] !== password) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate mock token
    const token = `mock-token-${user.id}-${Date.now()}`;

    // Return user data
    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
