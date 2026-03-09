import { NextResponse } from 'next/server';
import { mockAdminStats, mockKYCSubmissions, mockAdminWithdrawals } from '@/lib/api/adminMockData';

export async function GET() {
  const pendingKYC = mockKYCSubmissions.filter(k => k.status === 'pending').length;
  const pendingWithdrawals = mockAdminWithdrawals.filter(w => w.status === 'pending').length;

  const metrics = {
    total_users: mockAdminStats.totalUsers,
    active_trips: mockAdminStats.activeTrips,
    pending_shipments: mockAdminStats.pendingShipments,
    revenue_30_days: mockAdminStats.totalRevenue,
    pending_kyc: pendingKYC,
    pending_withdrawals: pendingWithdrawals,
    trends: {
      users: { value: 12.5, direction: 'up' as const },
      trips: { value: 8.3, direction: 'up' as const },
      shipments: { value: -2.1, direction: 'down' as const },
      revenue: { value: 15.7, direction: 'up' as const },
    },
  };

  return NextResponse.json({
    data: metrics,
    meta: {
      cached_at: new Date().toISOString(),
      cache_ttl: 300, // 5 minutes
    },
  });
}
