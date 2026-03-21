import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const response = await makeAdminRequest(
      request,
      `/api/admin/admins/${params.id}/role`,
      { method: 'PUT', body: JSON.stringify(body) }
    );
    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update admin role' },
      { status: 500 }
    );
  }
}
