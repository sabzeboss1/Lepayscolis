'use client';

import { useEffect, useState } from 'react';
import { Users, Plane, Package, DollarSign, FileCheck, Wallet } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import ActivityFeed, { Activity } from '@/components/admin/ActivityFeed';
import { AlertBanners, Alert } from '@/components/admin/AlertBanner';
import LineChart from '@/components/admin/LineChart';
import BarChart from '@/components/admin/BarChart';
import PieChart from '@/components/admin/PieChart';

interface DashboardMetrics {
  total_users: number;
  active_trips: number;
  pending_shipments: number;
  revenue_30_days: number;
  pending_kyc: number;
  pending_withdrawals: number;
  trends: {
    users: { value: number; direction: 'up' | 'down' | 'neutral' };
    trips: { value: number; direction: 'up' | 'down' | 'neutral' };
    shipments: { value: number; direction: 'up' | 'down' | 'neutral' };
    revenue: { value: number; direction: 'up' | 'down' | 'neutral' };
  };
}

interface ChartData {
  user_growth: Array<{ date: string; count: number }>;
  revenue_data: Array<{ date: string; amount: number }>;
  shipment_status: Array<{ status: string; count: number }>;
  top_routes: Array<{ route: string; count: number }>;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Import API client and endpoints
      const { apiClient } = await import('@/lib/api/client');
      const { API_ENDPOINTS } = await import('@/lib/api/endpoints');

      // Fetch metrics from real API
      const metricsData = await apiClient.get<{ data: DashboardMetrics }>(
        `${API_ENDPOINTS.admin.dashboard}/metrics`
      );
      setMetrics(metricsData.data);

      // Fetch chart data from real API
      const chartsData = await apiClient.get<{ data: ChartData }>(
        `${API_ENDPOINTS.admin.dashboard}/charts`
      );
      setChartData(chartsData.data);

      // Fetch activity feed from real API
      const activityData = await apiClient.get<{ data: Activity[] }>(
        `${API_ENDPOINTS.admin.dashboard}/activity`
      );
      setActivities(activityData.data);

      // Generate alerts based on metrics
      const newAlerts: Alert[] = [];
      
      if (metricsData.data.pending_kyc > 10) {
        newAlerts.push({
          id: 'kyc-pending',
          type: 'warning',
          title: 'KYC Submissions Pending',
          message: `There are ${metricsData.data.pending_kyc} KYC submissions waiting for review.`,
          action: {
            label: 'Review KYC Submissions',
            href: '/admin/kyc'
          },
          dismissible: true
        });
      }

      if (metricsData.data.pending_withdrawals > 5) {
        newAlerts.push({
          id: 'withdrawals-pending',
          type: 'info',
          title: 'Withdrawal Requests Pending',
          message: `${metricsData.data.pending_withdrawals} withdrawal requests require your attention.`,
          action: {
            label: 'Review Withdrawals',
            href: '/admin/withdrawals'
          },
          dismissible: true
        });
      }

      if (metricsData.data.pending_shipments > 20) {
        newAlerts.push({
          id: 'shipments-pending',
          type: 'info',
          title: 'High Volume of Pending Shipments',
          message: `There are ${metricsData.data.pending_shipments} shipments awaiting acceptance.`,
          action: {
            label: 'View Shipments',
            href: '/admin/shipments'
          },
          dismissible: true
        });
      }

      setAlerts(newAlerts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Overview of platform activity and key metrics
        </p>
      </div>

      {/* Alert Banners */}
      <AlertBanners alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics?.total_users.toLocaleString() || '0'}
          icon={Users}
          trend={metrics ? {
            value: metrics.trends.users.value,
            direction: metrics.trends.users.direction,
            label: 'vs last month'
          } : undefined}
          href="/admin/users"
          loading={loading}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />

        <MetricCard
          title="Active Trips"
          value={metrics?.active_trips.toLocaleString() || '0'}
          icon={Plane}
          trend={metrics ? {
            value: metrics.trends.trips.value,
            direction: metrics.trends.trips.direction,
            label: 'vs last month'
          } : undefined}
          href="/admin/trips"
          loading={loading}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />

        <MetricCard
          title="Pending Shipments"
          value={metrics?.pending_shipments.toLocaleString() || '0'}
          icon={Package}
          trend={metrics ? {
            value: metrics.trends.shipments.value,
            direction: metrics.trends.shipments.direction,
            label: 'vs last month'
          } : undefined}
          href="/admin/shipments"
          loading={loading}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <MetricCard
          title="Revenue (30 days)"
          value={metrics ? formatCurrency(metrics.revenue_30_days) : '€0'}
          icon={DollarSign}
          trend={metrics ? {
            value: metrics.trends.revenue.value,
            direction: metrics.trends.revenue.direction,
            label: 'vs previous period'
          } : undefined}
          href="/admin/payments"
          loading={loading}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />

        <MetricCard
          title="Pending KYC"
          value={metrics?.pending_kyc.toLocaleString() || '0'}
          icon={FileCheck}
          href="/admin/kyc"
          loading={loading}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
        />

        <MetricCard
          title="Pending Withdrawals"
          value={metrics?.pending_withdrawals.toLocaleString() || '0'}
          icon={Wallet}
          href="/admin/withdrawals"
          loading={loading}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
        />
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 30 Days)</h2>
            {chartData && chartData.user_growth.length > 0 ? (
              <LineChart
                data={chartData.user_growth.map(item => ({
                  label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: item.count
                }))}
                height={300}
                color="#3B82F6"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                {loading ? 'Loading...' : 'No data available'}
              </div>
            )}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h2>
            {chartData && chartData.revenue_data.length > 0 ? (
              <LineChart
                data={chartData.revenue_data.map(item => ({
                  label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: item.amount
                }))}
                height={300}
                color="#10B981"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                {loading ? 'Loading...' : 'No data available'}
              </div>
            )}
          </div>

          {/* Top Routes Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Routes</h2>
            {chartData && chartData.top_routes.length > 0 ? (
              <BarChart
                data={chartData.top_routes.map(item => ({
                  label: item.route,
                  value: item.count
                }))}
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                {loading ? 'Loading...' : 'No data available'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Activity Feed & Shipment Status */}
        <div className="space-y-6">
          {/* Shipment Status Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Status</h2>
            {chartData && chartData.shipment_status.length > 0 ? (
              <PieChart
                data={chartData.shipment_status.map(item => ({
                  label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                  value: item.count
                }))}
                size={250}
                donut={true}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                {loading ? 'Loading...' : 'No data available'}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <ActivityFeed
            activities={activities}
            loading={loading}
            autoRefresh={true}
            refreshInterval={60}
            onRefresh={fetchDashboardData}
          />
        </div>
      </div>
    </div>
  );
}
