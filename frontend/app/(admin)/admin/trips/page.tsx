'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAdminCurrency } from '@/lib/hooks/useAdminCurrency';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import BulkActions, { BulkAction } from '@/components/admin/BulkActions';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Trip {
  id: string;
  traveler: { id: string; name: string; email: string };
  origin: string;
  destination: string;
  departure_date: string;
  arrival_date: string;
  available_space: number;
  price_per_kg: number;
  currency_code: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'active';
  verification_status: 'pending' | 'verified' | 'rejected';
  shipments_count: number;
  created_at: string;
}

interface TripFilterValues {
  [key: string]: string;
  search: string;
  status: string;
  verification_status: string;
}

export default function TripsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { formatCurrency } = useAdminCurrency();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'departure'>('newest');
  const [filters, setFilters] = useState<TripFilterValues>({
    search: '',
    status: '',
    verification_status: ''
  });

  useEffect(() => {
    fetchTrips();
  }, [currentPage, perPage, sortBy, filters]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.verification_status) params.verification_status = filters.verification_status;

      const data = await apiClient.get<{ data: Trip[]; meta: { total: number } }>(
        API_ENDPOINTS.admin.trips.list,
        { params }
      );

      setTrips(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      setTrips([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? new Set(trips.map(t => t.id)) : new Set());
  };

  const handleBulkAction = async (actionKey: string) => {
    const selectedIds = Array.from(selectedRows);
    try {
      if (actionKey === 'verify') {
        await Promise.all(
          selectedIds.map(id =>
            apiClient.post<any>(API_ENDPOINTS.admin.trips.verify(id))
          )
        );
      } else if (actionKey === 'reject') {
        const reason = prompt(t('admin.trips.detail.rejectDialog.placeholder'));
        if (!reason || reason.length < 10) return;
        await Promise.all(
          selectedIds.map(id =>
            apiClient.post<any>(API_ENDPOINTS.admin.trips.reject(id), { reason })
          )
        );
      }
      fetchTrips();
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800'
    };
    const key = status as keyof typeof badges;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[key] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.trips.statuses.${status}`) || status}
      </span>
    );
  };

  const getVerificationBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.trips.verificationStatuses.${status}`) || status}
      </span>
    );
  };

  const columns: Column<Trip>[] = [
    {
      key: 'traveler',
      label: t('admin.trips.columns.traveler'),
      render: (trip) => (
        <div>
          <div className="font-medium text-gray-900">{trip.traveler.name}</div>
          <div className="text-sm text-gray-500">{trip.traveler.email}</div>
        </div>
      )
    },
    {
      key: 'route',
      label: t('admin.trips.columns.route'),
      render: (trip) => (
        <div className="text-sm text-gray-900">
          {trip.origin} → {trip.destination}
        </div>
      )
    },
    {
      key: 'departure_date',
      label: t('admin.trips.columns.departure'),
      sortable: true,
      render: (trip) => (
        <span className="text-sm text-gray-900">
          {new Date(trip.departure_date).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'available_space',
      label: t('admin.trips.columns.space'),
      render: (trip) => <span className="text-sm text-gray-900">{trip.available_space} kg</span>
    },
    {
      key: 'price_per_kg',
      label: t('admin.trips.columns.pricePerKg'),
      render: (trip) => <span className="text-sm text-gray-900">{formatCurrency(trip.price_per_kg, trip.currency_code)}</span>
    },
    {
      key: 'shipments_count',
      label: t('admin.trips.columns.shipments'),
      render: (trip) => <span className="text-sm text-gray-900">{trip.shipments_count}</span>
    },
    {
      key: 'status',
      label: t('admin.trips.columns.status'),
      sortable: true,
      render: (trip) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(trip.status)}
          {getVerificationBadge(trip.verification_status)}
        </div>
      )
    }
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'text' as const,
      key: 'search',
      label: t('admin.trips.filters.search'),
      placeholder: t('admin.trips.filters.searchPlaceholder')
    },
    {
      type: 'select' as const,
      key: 'status',
      label: t('admin.trips.filters.status'),
      options: [
        { value: 'upcoming', label: t('admin.trips.statuses.upcoming') },
        { value: 'in_progress', label: t('admin.trips.statuses.in_progress') },
        { value: 'completed', label: t('admin.trips.statuses.completed') },
        { value: 'cancelled', label: t('admin.trips.statuses.cancelled') }
      ]
    },
    {
      type: 'select' as const,
      key: 'verification_status',
      label: t('admin.trips.filters.verificationStatus'),
      options: [
        { value: 'pending', label: t('admin.trips.verificationStatuses.pending') },
        { value: 'verified', label: t('admin.trips.verificationStatuses.verified') },
        { value: 'rejected', label: t('admin.trips.verificationStatuses.rejected') }
      ]
    }
  ];

  const bulkActions: BulkAction[] = [
    { key: 'verify', label: t('admin.trips.bulk.verifySelected'), variant: 'default' as const },
    { key: 'reject', label: t('admin.trips.bulk.rejectSelected'), variant: 'danger' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.trips.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('admin.trips.subtitle')}</p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
            {t('admin.trips.sortBy')}:
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as typeof sortBy);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">{t('admin.trips.sortNewest')}</option>
            <option value="oldest">{t('admin.trips.sortOldest')}</option>
            <option value="departure">{t('admin.trips.sortDeparture')}</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={(newFilters) => {
          setFilters(newFilters as TripFilterValues);
          setCurrentPage(1);
        }}
        onReset={() => setFilters({ search: '', status: '', verification_status: '' })}
      />

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <BulkActions
          selectedCount={selectedRows.size}
          actions={bulkActions}
          onAction={handleBulkAction}
          onClearSelection={() => setSelectedRows(new Set())}
        />
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={trips}
        loading={loading}
        emptyMessage={t('admin.trips.noTrips')}
        onRowClick={(trip) => router.push(`/admin/trips/${trip.id}`)}
        getRowId={(trip) => trip.id}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        selectable={true}
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(total / perPage)}
        itemsPerPage={perPage}
        totalItems={total}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newPerPage: number) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
