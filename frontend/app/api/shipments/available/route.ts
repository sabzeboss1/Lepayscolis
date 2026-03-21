import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params = new URLSearchParams();
    if (searchParams.get('pickup_country')) params.append('pickup_country', searchParams.get('pickup_country')!);
    if (searchParams.get('delivery_country')) params.append('delivery_country', searchParams.get('delivery_country')!);
    if (searchParams.get('pickup_city')) params.append('pickup_city', searchParams.get('pickup_city')!);
    if (searchParams.get('delivery_city')) params.append('delivery_city', searchParams.get('delivery_city')!);
    if (searchParams.get('max_weight')) params.append('max_weight', searchParams.get('max_weight')!);
    if (searchParams.get('page')) params.append('page', searchParams.get('page')!);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/shipments/available?${params.toString()}`;
    
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
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching available shipments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch available shipments' },
      { status: 500 }
    );
  }
}
