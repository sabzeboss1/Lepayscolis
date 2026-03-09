'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';

interface Shipment {
  id: string;
  tracking_number: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  recipient: {
    name: string;
    phone: string;
  };
  weight: number;
  price: number;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  delivery_date?: string;
}

interface FilterValues {
  search: string;
  status: string;
  sort_by: string;
}

export default function ShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: '',
    sort_by: 'newest'
  });

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(`/api/admin/shipments?${params}`);
      const data = await response.json();
      
      setShipments(data.data);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [currentPage, perPage, sortKey, sortDirection, filters]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const columns: Column<Shipment>[] = [
    {
      key: 'tracking_number',
      label: 'Tracking Number',
      sortable: true,
      render: (shipment) => (
        <span className="font-mono text-sm text-gray-900">{shipment.tracking_number}</span>
      )
    },
    {
      key: 'sender',
      label: 'Sender',
      render: (shipment) => (
        <div>
          <div className="font-medium text-gray-900">{shipment.sender.name}</div>
          <div className="text-sm text-gray-500">{shipment.sender.email}</div>
        </div>
      )
    },
    {
      key: 'recipient',
      label: 'Recipient',
      render: (shipment) => (
        <div>
          <div className="font-medium text-gray-900">{shipment.recipient.name}</div>
          <div className="text-sm text-gray-500">{shipment.recipient.phone}</div>
        </div>
      )
    },
    {
      key: 'weight',
      label: 'Weight',
      sortable: true,
      render: (shipment) => (
        <span className="text-sm text-gray-900">{shipment.weight} kg</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (shipment) => (
        <span className="text-sm text-gray-900">{formatCurrency(shipment.price)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (shipment) => getStatusBadge(shipment.status)
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (shipment) => (
        <span className="text-sm text-gray-900">
          {new Date(shipment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ];

  const filterConfig = [
    {
      type: 'text' as const,
      name: 'search',
      label: 'Search',
      placeholder: 'Search by tracking, sender, or recipient...',
      value: filters.search
    },
    {
      type: 'select' as const,
      name: 'status',
      label: 'Status',
      value: filters.status,
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      type: 'select' as const,
      name: 'sort_by',
      label: 'Sort By',
      value: filters.sort_by,
      options: [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'price_low', label: 'Price: Low to High' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and track all shipments on the platform
        </p>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '', status: '', sort_by: 'newest' })}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={shipments}
        loading={loading}
        emptyMessage="No shipments found"
        onSort={handleSort}
        onRowClick={(shipment) => router.push(`/admin/shipments/${shipment.id}`)}
        getRowId={(shipment) => shipment.id}
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(total / perPage)}
        perPage={perPage}
        total={total}
        onPageChange={setCurrentPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
