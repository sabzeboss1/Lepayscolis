import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(request: NextRequest) {
  try {
    // Call Laravel backend API with authentication
    const response = await makeAdminRequest(
      request,
      '/api/admin/dashboard/metrics',
      { method: 'GET' }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch dashboard metrics:', error);
    
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch dashboard metrics',
        data: {
          total_users: 0,
          active_trips: 0,
          pending_shipments: 0,
          revenue_30_days: 0,
          pending_kyc: 0,
          pending_withdrawals: 0,
          trends: {
            users: { value: 0, direction: 'neutral' },
            trips: { value: 0, direction: 'neutral' },
            shipments: { value: 0, direction: 'neutral' },
            revenue: { value: 0, direction: 'neutral' }
          }
        }
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
