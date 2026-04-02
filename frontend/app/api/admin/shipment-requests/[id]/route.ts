import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/shipment-requests/${params.id}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Accept': 'application/json',
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
    console.error('Error fetching shipment request:', error);
    return NextResponse.json(
      { message: 'Failed to fetch shipment request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/shipment-requests/${params.id}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting shipment request:', error);
    return NextResponse.json(
      { message: 'Failed to delete shipment request' },
      { status: 500 }
    );
  }
}
