import { NextRequest, NextResponse } from 'next/server';
import { generateMockUser } from '@/lib/api/mockData';

// Mock user storage (in-memory for development)
const registeredUsers: any[] = [];
const mockPasswords: Record<string, string> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    // Validate input
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = registeredUsers.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user using mock generator
    const newUser = generateMockUser({
      email,
      name,
      phone,
      rating: 0,
      completed_deliveries: 0,
      is_recommended: false,
      kyc_status: 'not_submitted',
      created_at: new Date().toISOString(),
      locale: 'en',
    });

    registeredUsers.push(newUser);
    mockPasswords[email] = password;

    // Generate mock token
    const token = `mock-token-${newUser.id}-${Date.now()}`;

    // Return user data
    return NextResponse.json({
      token,
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
