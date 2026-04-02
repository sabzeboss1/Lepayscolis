import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();
    
    if (searchParams.get('search')) params.append('search', searchParams.get('search')!);
    if (searchParams.get('status')) params.append('status', searchParams.get('status')!);
    if (searchParams.get('from_date')) params.append('from_date', searchParams.get('from_date')!);
    if (searchParams.get('to_date')) params.append('to_date', searchParams.get('to_date')!);
    if (searchParams.get('per_page')) params.append('per_page', searchParams.get('per_page')!);
    if (searchParams.get('page')) params.append('page', searchParams.get('page')!);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/shipment-requests?${params.toString()}`;

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
    console.error('Error fetching shipment requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch shipment requests' },
      { status: 500 }
    );
  }
}
