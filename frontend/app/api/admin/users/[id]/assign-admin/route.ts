import { NextRequest, NextResponse } from 'next/server';
import { mockAdminUsers } from '@/lib/api/adminMockData';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const user = mockAdminUsers.find(u => u.id === params.id);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Update user role (in mock data)
  user.role = user.role === 'admin' ? 'user' : 'admin';

  return NextResponse.json({
    message: `User role updated to ${user.role} successfully`,
    data: {
      user_id: user.id,
      role: user.role
    }
  });
}
