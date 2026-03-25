import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    const response = await makeAdminRequest(request, '/api/admin/settings');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || 'Failed to fetch settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch settings' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await makeAdminRequest(
      request,
      '/api/admin/settings',
      {
        method: 'PUT',
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
      { message: error.message || 'Failed to update settings' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
