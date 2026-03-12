'use client';

import { useEffect, useState } from 'react';
import { Users, Plane, Package, DollarSign, FileCheck, Wallet } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import ActivityFeed, { Activity } from '@/components/admin/ActivityFeed';
import { AlertBanners, Alert } from '@/components/admin/AlertBanner';
import LineChart from '@/components/admin/LineChart';
import BarChart from '@/components/admin/BarChart';
import PieChart from '@/components/admin/PieChart';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface DashboardMetrics {
  total_users: number;
  active_trips: number;
  pending_shipments: number;
  revenue_30_days: number;
  revenue_30_days_formatted: string;
  pending_kyc: number;
  pending_withdrawals: number;
  alerts: Array<{
    type: string;
    message: string;
    link: string;
  }>;
}

interface ChartData {
  user_growth: Array<{ date: string; count: number }>;
  revenue_data: Array<{ date: string; amount: number }>;
  shipment_status: Array<{ status: string; count: number }>;
  top_routes: Array<{ route: string; count: number }>;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
  link: string;
}

export default function AdminDashboardPage() {
  const { t, locale } = useTranslation();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch all dashboard data in parallel from backend API
      const [metricsRes, chartsRes, activityRes] = await Promise.all([
        apiClient.get<{ data: DashboardMetrics }>(API_ENDPOINTS.admin.dashboard.metrics),
        apiClient.get<{ data: ChartData }>(API_ENDPOINTS.admin.dashboard.charts),
        apiClient.get<{ data: ActivityItem[] }>(API_ENDPOINTS.admin.dashboard.activity, {
          params: { limit: 20 },
        }),
      ]);

      setMetrics(metricsRes.data);
      setChartData(chartsRes.data);

      // Map backend activity to ActivityFeed component format
      setActivities(
        activityRes.data.map((item) => ({
          id: `${item.type}-${item.timestamp}`,
          type: item.type as Activity['type'],
          description: item.description,
          timestamp: item.timestamp,
          user: item.user,
          link: item.link,
        }))
      );

      // Map backend alerts to AlertBanner component format
      if (metricsRes.data.alerts && metricsRes.data.alerts.length > 0) {
        setAlerts(
          metricsRes.data.alerts.map((alert, index) => ({
            id: `alert-${index}`,
            type: alert.type as Alert['type'],
            title: alert.message.split('.')[0],
            message: alert.message,
            action: {
              label: t('common.view'),
              href: alert.link,
            },
            dismissible: true,
          }))
        );
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || t('admin.dashboard.noData'));
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

  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(dateLocale, {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('admin.dashboard.subtitle')}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-sm font-medium text-red-700 hover:text-red-900 underline"
          >
            {t('admin.dashboard.retry')}
          </button>
        </div>
      )}

      {/* Alert Banners */}
      <AlertBanners alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title={t('admin.dashboard.totalUsers')}
          value={metrics?.total_users.toLocaleString() || '0'}
          icon={Users}
          href="/admin/users"
          loading={loading}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />

        <MetricCard
          title={t('admin.dashboard.activeTrips')}
          value={metrics?.active_trips.toLocaleString() || '0'}
          icon={Plane}
          href="/admin/trips"
          loading={loading}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />

        <MetricCard
          title={t('admin.dashboard.pendingShipments')}
          value={metrics?.pending_shipments.toLocaleString() || '0'}
          icon={Package}
          href="/admin/shipments"
          loading={loading}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <MetricCard
          title={t('admin.dashboard.revenue30Days')}
          value={metrics ? formatCurrency(metrics.revenue_30_days) : '0 €'}
          icon={DollarSign}
          href="/admin/payments"
          loading={loading}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />

        <MetricCard
          title={t('admin.dashboard.pendingKyc')}
          value={metrics?.pending_kyc.toLocaleString() || '0'}
          icon={FileCheck}
          href="/admin/kyc"
          loading={loading}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
        />

        <MetricCard
          title={t('admin.dashboard.pendingWithdrawals')}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.userGrowth')}</h2>
            {chartData && chartData.user_growth.length > 0 ? (
              <LineChart
                data={chartData.user_growth.map(item => ({
                  label: new Date(item.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }),
                  value: item.count
                }))}
                height={300}
                color="#3B82F6"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                {loading ? t('admin.dashboard.loading') : t('admin.dashboard.noData')}
              </div>
            )}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.revenueTrend')}</h2>
            {chartData && chartData.revenue_data.length > 0 ? (
              <LineChart
                data={chartData.revenue_data.map(item => ({
                  label: new Date(item.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }),
                  value: item.amount
                }))}
                height={300}
                color="#10B981"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                {loading ? t('admin.dashboard.loading') : t('admin.dashboard.noData')}
              </div>
            )}
          </div>

          {/* Top Routes Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.topRoutes')}</h2>
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
                {loading ? t('admin.dashboard.loading') : t('admin.dashboard.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Activity Feed & Shipment Status */}
        <div className="space-y-6">
          {/* Shipment Status Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.shipmentStatus')}</h2>
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
                {loading ? t('admin.dashboard.loading') : t('admin.dashboard.noData')}
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
