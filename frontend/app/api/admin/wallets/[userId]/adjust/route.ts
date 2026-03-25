import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const response = await makeAdminRequest(
      request,
      `/api/admin/wallets/${params.userId}/adjust`,
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
    return NextResponse.json(
      { message: error.message || 'Failed to adjust balance' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
