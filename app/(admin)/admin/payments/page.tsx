'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';

interface Payment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  stripe_payment_id: string;
  method: 'card' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  shipment?: {
    id: string;
    tracking_number: string;
  };
  created_at: string;
  completed_at?: string;
}

interface FilterValues {
  status: string;
  method: string;
  date_from: string;
  date_to: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<FilterValues>({
    status: '',
    method: '',
    date_from: '',
    date_to: ''
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      });

      const response = await fetch(`/api/admin/payments?${params}`);
      const data = await response.json();
      
      setPayments(data.data);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
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
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      card: 'bg-blue-100 text-blue-800',
      wallet: 'bg-purple-100 text-purple-800'
    };
    const labels = {
      card: 'Card',
      wallet: 'Wallet'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[method as keyof typeof badges]}`}>
        {labels[method as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const columns: Column<Payment>[] = [
    {
      key: 'stripe_payment_id',
      label: 'Payment ID',
      render: (payment) => (
        <span className="font-mono text-sm text-gray-900">{payment.stripe_payment_id.substring(0, 16)}...</span>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (payment) => (
        <div>
          <div className="font-medium text-gray-900">{payment.user.name}</div>
          <div className="text-sm text-gray-500">{payment.user.email}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (payment) => (
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
      )
    },
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      render: (payment) => getMethodBadge(payment.method)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (payment) => getStatusBadge(payment.status)
    },
    {
      key: 'shipment',
      label: 'Shipment',
      render: (payment) => (
        payment.shipment ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/shipments/${payment.shipment!.id}`);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-mono"
          >
            {payment.shipment.tracking_number}
          </button>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      )
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (payment) => (
        <span className="text-sm text-gray-900">
          {new Date(payment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    }
  ];

  const filterConfig = [
    {
      type: 'select' as const,
      name: 'status',
      label: 'Status',
      value: filters.status,
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' }
      ]
    },
    {
      type: 'select' as const,
      name: 'method',
      label: 'Method',
      value: filters.method,
      options: [
        { value: '', label: 'All Methods' },
        { value: 'card', label: 'Card' },
        { value: 'wallet', label: 'Wallet' }
      ]
    },
    {
      type: 'date' as const,
      name: 'date_from',
      label: 'From Date',
      value: filters.date_from
    },
    {
      type: 'date' as const,
      name: 'date_to',
      label: 'To Date',
      value: filters.date_to
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Transactions</h1>
        <p className="text-sm text-gray-600 mt-1">
          View and manage all payment transactions on the platform
        </p>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ status: '', method: '', date_from: '', date_to: '' })}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="No payment transactions found"
        onSort={handleSort}
        onRowClick={(payment) => router.push(`/admin/payments/${payment.id}`)}
        getRowId={(payment) => payment.id}
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
