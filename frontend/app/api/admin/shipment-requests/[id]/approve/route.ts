import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/shipment-requests/${params.id}/approve`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error approving shipment request:', error);
    return NextResponse.json(
      { message: 'Failed to approve shipment request' },
      { status: 500 }
    );
  }
}
