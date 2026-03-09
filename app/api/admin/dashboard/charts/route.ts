import { NextResponse } from 'next/server';
import { mockAdminShipments, mockAdminTrips } from '@/lib/api/adminMockData';

export async function GET() {
  // Generate user growth data for last 30 days
  const userGrowth = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 15) + 5
    };
  });

  // Generate revenue data for last 30 days
  const revenueData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 800) + 200
    };
  });

  // Calculate shipment status distribution
  const shipmentStatusCounts = mockAdminShipments.reduce((acc, shipment) => {
    acc[shipment.status] = (acc[shipment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const shipmentStatus = Object.entries(shipmentStatusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // Calculate top routes from trips
  const routeCounts = mockAdminTrips.reduce((acc, trip) => {
    const route = `${trip.departure.city} → ${trip.arrival.city}`;
    acc[route] = (acc[route] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topRoutes = Object.entries(routeCounts)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    data: {
      user_growth: userGrowth,
      revenue_data: revenueData,
      shipment_status: shipmentStatus,
      top_routes: topRoutes
    }
  });
}
