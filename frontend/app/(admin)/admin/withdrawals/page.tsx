'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import WithdrawalApprovalModal from '@/components/admin/WithdrawalApprovalModal';
import { useTranslation } from '@/lib/i18n';
import { useAdminCurrency } from '@/lib/hooks/useAdminCurrency';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  formatted_amount?: string;
  fee: number;
  formatted_fee?: string;
  net_amount: number;
  formatted_net_amount?: string;
  currency?: string;
  payment_method?: string;
  payment_details?: Record<string, string>;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  status_badge?: { color: string; text: string };
  rejection_reason?: string;
  approved_by?: { id: string; name: string };
  approved_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

interface WithdrawalFilterValues {
  status: string;
  search: string;
}

export default function WithdrawalsPage() {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [formattedPendingAmount, setFormattedPendingAmount] = useState('');
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<WithdrawalFilterValues>({
    status: '',
    search: '',
  });
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/admin/withdrawals?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWithdrawals(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
      setTotalPendingAmount(data.meta?.total_pending_amount || 0);
      setFormattedPendingAmount(data.meta?.formatted_total_pending || '');
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
      setWithdrawals([]);
      setTotal(0);
      setError(t('admin.withdrawals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, perPage, sortKey, sortDirection, filters]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters as WithdrawalFilterValues);
    setCurrentPage(1);
  };

  const handleRowClick = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(true);
  };

  const handleApprove = async (id: string) => {
    const response = await fetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to approve');
    }
    fetchWithdrawals();
  };

  const handleReject = async (id: string, reason: string) => {
    const response = await fetch(`/api/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to reject');
    }
    fetchWithdrawals();
  };

  const handleProcessing = async (id: string) => {
    const response = await fetch(`/api/admin/withdrawals/${id}/processing`, { method: 'POST' });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to mark as processing');
    }
    fetchWithdrawals();
  };

  const handleComplete = async (id: string) => {
    const response = await fetch(`/api/admin/withdrawals/${id}/complete`, { method: 'POST' });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to complete');
    }
    fetchWithdrawals();
  };

  const { formatCurrency } = useAdminCurrency();

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.withdrawals.statuses.${status}`)}
      </span>
    );
  };

  const columns: Column<WithdrawalRequest>[] = [
    {
      key: 'user',
      label: t('admin.withdrawals.columns.user'),
      render: (withdrawal) => (
        <div>
          <div className="font-medium text-gray-900">{withdrawal.user?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{withdrawal.user?.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: t('admin.withdrawals.columns.amount'),
      sortable: true,
      render: (withdrawal) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {withdrawal.formatted_amount || formatCurrency(withdrawal.amount, withdrawal.currency)}
          </div>
          <div className="text-xs text-gray-500">
            {t('admin.withdrawals.columns.fee')}: {withdrawal.formatted_fee || formatCurrency(withdrawal.fee, withdrawal.currency)}
          </div>
        </div>
      ),
    },
    {
      key: 'net_amount',
      label: t('admin.withdrawals.columns.netAmount'),
      sortable: true,
      render: (withdrawal) => (
        <span className="text-sm font-semibold text-green-600">
          {withdrawal.formatted_net_amount || formatCurrency(withdrawal.net_amount, withdrawal.currency)}
        </span>
      ),
    },
    {
      key: 'payment_method',
      label: t('admin.withdrawals.columns.paymentMethod'),
      render: (withdrawal) => (
        <span className="text-sm text-gray-900 capitalize">
          {withdrawal.payment_method?.replace(/_/g, ' ') || 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('admin.withdrawals.columns.status'),
      sortable: true,
      render: (withdrawal) => getStatusBadge(withdrawal.status),
    },
    {
      key: 'created_at',
      label: t('admin.withdrawals.columns.requested'),
      sortable: true,
      render: (withdrawal) => (
        <span className="text-sm text-gray-900">
          {new Date(withdrawal.created_at).toLocaleDateString('fr-FR', {
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
      type: 'text',
      key: 'search',
      label: t('admin.withdrawals.filters.search'),
      placeholder: t('admin.withdrawals.filters.searchPlaceholder'),
    },
    {
      type: 'select',
      key: 'status',
      label: t('admin.withdrawals.filters.status'),
      options: [
        { value: 'pending', label: t('admin.withdrawals.statuses.pending') },
        { value: 'approved', label: t('admin.withdrawals.statuses.approved') },
        { value: 'processing', label: t('admin.withdrawals.statuses.processing') },
        { value: 'completed', label: t('admin.withdrawals.statuses.completed') },
        { value: 'rejected', label: t('admin.withdrawals.statuses.rejected') },
        { value: 'cancelled', label: t('admin.withdrawals.statuses.cancelled') },
      ],
    },
  ];

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.withdrawals.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('admin.withdrawals.subtitle')}</p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">{t('admin.withdrawals.totalPendingAmount')}</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {formattedPendingAmount || formatCurrency(totalPendingAmount)}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {pendingCount} {t('admin.withdrawals.pendingRequests')}
            </p>
          </div>
          <div className="bg-yellow-200 rounded-full p-4">
            <svg className="w-8 h-8 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchWithdrawals} className="text-sm text-red-600 hover:text-red-800 font-medium">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters({ status: '', search: '' }); setCurrentPage(1); }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={withdrawals}
        loading={loading}
        emptyMessage={t('admin.withdrawals.noWithdrawals')}
        onSort={handleSort}
        onRowClick={handleRowClick}
        getRowId={(withdrawal) => withdrawal.id}
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

      {/* Approval Modal */}
      <WithdrawalApprovalModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedWithdrawal(null);
        }}
        withdrawal={selectedWithdrawal}
        onApprove={handleApprove}
        onReject={handleReject}
        onProcessing={handleProcessing}
        onComplete={handleComplete}
      />
    </div>
  );
}
