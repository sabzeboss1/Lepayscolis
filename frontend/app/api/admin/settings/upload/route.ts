import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      return NextResponse.json(
        { message: 'Unauthorized - No admin token found' },
        { status: 401 }
      );
    }

    // Forward the multipart form data as-is to the backend
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/admin/settings/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to upload branding asset' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
