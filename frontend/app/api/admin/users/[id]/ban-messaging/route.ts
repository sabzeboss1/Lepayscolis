import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const response = await makeAdminRequest(
      request,
      `/api/admin/users/${params.id}/ban-messaging`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to ban user from messaging:', error);

    return NextResponse.json(
      { message: error.message || 'Failed to ban user from messaging' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
