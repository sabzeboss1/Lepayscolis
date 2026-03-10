import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      '/api/admin/dashboard/charts',
      { method: 'GET' }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch dashboard charts:', error);
    
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch dashboard charts',
        data: {
          user_growth: [],
          revenue_data: [],
          shipment_status: [],
          top_routes: []
        }
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
