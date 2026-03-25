import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    // Get search params from the request URL
    const searchParams = request.nextUrl.searchParams;
    
    // Build query string for backend
    const queryParams = new URLSearchParams();
    
    // Map frontend params to backend params
    if (searchParams.get('departure_city')) {
      queryParams.append('departure', searchParams.get('departure_city')!);
    }
    if (searchParams.get('arrival_city')) {
      queryParams.append('arrival', searchParams.get('arrival_city')!);
    }
    if (searchParams.get('date_from')) {
      queryParams.append('dateFrom', searchParams.get('date_from')!);
    }
    if (searchParams.get('date_to')) {
      queryParams.append('dateTo', searchParams.get('date_to')!);
    }
    if (searchParams.get('min_capacity')) {
      queryParams.append('minCapacity', searchParams.get('min_capacity')!);
    }
    // Note: traveler_name is not supported by backend yet
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${BACKEND_URL}/api/trips?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Search failed' }));
      return NextResponse.json(
        { message: errorData.message || 'Failed to search trips' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Trip search error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
