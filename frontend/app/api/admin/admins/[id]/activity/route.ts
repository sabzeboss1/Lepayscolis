import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await makeAdminRequest(
      request,
      `/api/admin/admins/${id}/activity`,
      { method: 'GET' }
    );
    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch admin activity', data: [] },
      { status: 500 }
    );
  }
}
