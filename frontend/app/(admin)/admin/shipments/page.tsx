'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import { useTranslation } from '@/lib/i18n';
import { useAdminCurrency } from '@/lib/hooks/useAdminCurrency';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Shipment {
  id: string;
  tracking_number: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  delivery_city: string;
  delivery_country: string;
  weight: number;
  price: number;
  currency_code?: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
}

interface ShipmentFilterValues {
  [key: string]: string;
  search: string;
  status: string;
}

export default function ShipmentsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filters, setFilters] = useState<ShipmentFilterValues>({
    search: '',
    status: '',
  });

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      const data = await apiClient.get<any>(API_ENDPOINTS.admin.shipments.list, { params });
      setShipments(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      setShipments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [currentPage, perPage, sortBy, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters as ShipmentFilterValues);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] ?? 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.shipments.statuses.${status}`) || status}
      </span>
    );
  };

  const { formatCurrency } = useAdminCurrency();

  const columns: Column<Shipment>[] = [
    {
      key: 'tracking_number',
      label: t('admin.shipments.columns.tracking'),
      sortable: true,
      render: (shipment) => (
        <span className="font-mono text-sm text-gray-900">{shipment.tracking_number}</span>
      ),
    },
    {
      key: 'sender',
      label: t('admin.shipments.columns.sender'),
      render: (shipment) => (
        <div>
          <div className="font-medium text-gray-900">{shipment.sender?.name}</div>
          <div className="text-sm text-gray-500">{shipment.sender?.email}</div>
        </div>
      ),
    },
    {
      key: 'destination',
      label: t('admin.shipments.columns.destination'),
      render: (shipment) => (
        <span className="text-sm text-gray-900">
          {shipment.delivery_city}{shipment.delivery_country ? `, ${shipment.delivery_country}` : ''}
        </span>
      ),
    },
    {
      key: 'weight',
      label: t('admin.shipments.columns.weight'),
      sortable: true,
      render: (shipment) => (
        <span className="text-sm text-gray-900">{shipment.weight} kg</span>
      ),
    },
    {
      key: 'price',
      label: t('admin.shipments.columns.price'),
      sortable: true,
      render: (shipment) => (
        <span className="text-sm text-gray-900">{formatCurrency(shipment.price, shipment.currency_code)}</span>
      ),
    },
    {
      key: 'status',
      label: t('admin.shipments.columns.status'),
      sortable: true,
      render: (shipment) => getStatusBadge(shipment.status),
    },
    {
      key: 'created_at',
      label: t('admin.shipments.columns.created'),
      sortable: true,
      render: (shipment) => (
        <span className="text-sm text-gray-900">
          {new Date(shipment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'text' as const,
      key: 'search',
      label: t('admin.shipments.filters.search'),
      placeholder: t('admin.shipments.filters.searchPlaceholder'),
    },
    {
      type: 'select' as const,
      key: 'status',
      label: t('admin.shipments.filters.status'),
      options: [
        { value: '', label: t('admin.shipments.filters.allStatuses') },
        { value: 'pending', label: t('admin.shipments.statuses.pending') },
        { value: 'accepted', label: t('admin.shipments.statuses.accepted') },
        { value: 'in_transit', label: t('admin.shipments.statuses.in_transit') },
        { value: 'delivered', label: t('admin.shipments.statuses.delivered') },
        { value: 'cancelled', label: t('admin.shipments.statuses.cancelled') },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.shipments.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('admin.shipments.subtitle')}</p>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{t('admin.shipments.sortBy')}:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">{t('admin.shipments.sortNewest')}</option>
            <option value="oldest">{t('admin.shipments.sortOldest')}</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters({ search: '', status: '' }); setCurrentPage(1); }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={shipments}
        loading={loading}
        emptyMessage={t('admin.shipments.noShipments')}
        onRowClick={(shipment) => router.push(`/admin/shipments/${shipment.id}`)}
        getRowId={(shipment) => shipment.id}
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
