import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await makeAdminRequest(
      request,
      `/api/admin/users/${params.id}/unban-messaging`,
      { method: 'POST' }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to unban user from messaging:', error);

    return NextResponse.json(
      { message: error.message || 'Failed to unban user from messaging' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
