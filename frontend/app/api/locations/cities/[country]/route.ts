import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  context: { params: Promise<{ country: string }> }
) {
  try {
    const params = await context.params;
    const country = decodeURIComponent(params.country);
    
    console.log('Fetching cities for country:', country);
    
    const response = await fetch(`${BACKEND_URL}/api/locations/cities/${encodeURIComponent(country)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error('Failed to fetch cities');
    }

    const data = await response.json();
    console.log('Cities data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
