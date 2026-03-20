'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import { useTranslation } from '@/lib/i18n';

interface Payment {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  amount: number;
  amount_formatted?: string;
  currency?: string;
  transaction_id?: string;
  payment_method?: string;
  status: string;
  shipment?: {
    id: string;
    tracking_number: string;
  } | null;
  created_at: string;
}

interface PaymentFilterValues {
  status: string;
  method: string;
  date_from: string;
  date_to: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<PaymentFilterValues>({
    status: '',
    method: '',
    date_from: '',
    date_to: '',
  });
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
      });

      const response = await fetch(`/api/admin/payments?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPayments(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
      setTotal(0);
      setError(t('admin.payments.errors.loadFailed'));
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

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters as PaymentFilterValues);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      escrowed: 'bg-blue-100 text-blue-800',
      released: 'bg-emerald-100 text-emerald-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.payments.statuses.${status}`)}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const badges: Record<string, string> = {
      card: 'bg-blue-100 text-blue-800',
      stripe: 'bg-blue-100 text-blue-800',
      wallet: 'bg-purple-100 text-purple-800',
      orange_money: 'bg-orange-100 text-orange-800',
      mtn_money: 'bg-yellow-100 text-yellow-800',
      bank_transfer: 'bg-cyan-100 text-cyan-800',
      cash: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[method] || 'bg-gray-100 text-gray-800'} capitalize`}>
        {method?.replace(/_/g, ' ') || 'N/A'}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const columns: Column<Payment>[] = [
    {
      key: 'transaction_id',
      label: t('admin.payments.columns.transactionId'),
      render: (payment) => (
        <span className="font-mono text-sm text-gray-900">
          {payment.transaction_id ? `${payment.transaction_id.substring(0, 16)}...` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'user',
      label: t('admin.payments.columns.user'),
      render: (payment) => (
        <div>
          <div className="font-medium text-gray-900">{payment.user?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{payment.user?.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: t('admin.payments.columns.amount'),
      sortable: true,
      render: (payment) => (
        <span className="text-sm font-semibold text-gray-900">
          {payment.amount_formatted || formatCurrency(payment.amount, payment.currency)}
        </span>
      ),
    },
    {
      key: 'payment_method',
      label: t('admin.payments.columns.method'),
      sortable: true,
      render: (payment) => getMethodBadge(payment.payment_method || ''),
    },
    {
      key: 'status',
      label: t('admin.payments.columns.status'),
      sortable: true,
      render: (payment) => getStatusBadge(payment.status),
    },
    {
      key: 'shipment',
      label: t('admin.payments.columns.shipment'),
      render: (payment) =>
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
        ),
    },
    {
      key: 'created_at',
      label: t('admin.payments.columns.date'),
      sortable: true,
      render: (payment) => (
        <span className="text-sm text-gray-900">
          {new Date(payment.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'select',
      key: 'status',
      label: t('admin.payments.filters.status'),
      options: [
        { value: 'pending', label: t('admin.payments.statuses.pending') },
        { value: 'completed', label: t('admin.payments.statuses.completed') },
        { value: 'failed', label: t('admin.payments.statuses.failed') },
        { value: 'refunded', label: t('admin.payments.statuses.refunded') },
      ],
    },
    {
      type: 'select',
      key: 'method',
      label: t('admin.payments.filters.method'),
      options: [
        { value: 'card', label: t('admin.payments.methods.card') },
        { value: 'stripe', label: 'Stripe' },
        { value: 'wallet', label: t('admin.payments.methods.wallet') },
        { value: 'orange_money', label: 'Orange Money' },
        { value: 'mtn_money', label: 'MTN Money' },
        { value: 'bank_transfer', label: t('admin.payments.methods.bankTransfer') },
      ],
    },
    {
      type: 'date',
      key: 'date_from',
      label: t('admin.payments.filters.dateFrom'),
    },
    {
      type: 'date',
      key: 'date_to',
      label: t('admin.payments.filters.dateTo'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.payments.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('admin.payments.subtitle')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchPayments} className="text-sm text-red-600 hover:text-red-800 font-medium">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters({ status: '', method: '', date_from: '', date_to: '' }); setCurrentPage(1); }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage={t('admin.payments.noPayments')}
        onSort={handleSort}
        onRowClick={(payment) => router.push(`/admin/payments/${payment.id}`)}
        getRowId={(payment) => payment.id}
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
