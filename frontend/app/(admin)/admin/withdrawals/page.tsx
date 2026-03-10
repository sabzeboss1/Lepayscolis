'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import WithdrawalApprovalModal from '@/components/admin/WithdrawalApprovalModal';

interface WithdrawalRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  fee: number;
  net_amount: number;
  bank_details: {
    account_holder: string;
    bank_name: string;
    account_number: string;
    routing_number?: string;
    iban?: string;
    swift_code?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface FilterValues {
  status: string;
  date_from: string;
  date_to: string;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [sortKey, setSortKey] = useState<string>('requested_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<FilterValues>({
    status: '',
    date_from: '',
    date_to: ''
  });

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.status && { status: filters.status }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      });

      // Call real Laravel backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/admin/withdrawals?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setWithdrawals(data.data);
      setTotal(data.meta.total);
      
      // Calculate total pending amount
      const pendingAmount = data.data
        .filter((w: WithdrawalRequest) => w.status === 'pending')
        .reduce((sum: number, w: WithdrawalRequest) => sum + w.amount, 0);
      setTotalPendingAmount(pendingAmount);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
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

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleRowClick = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(true);
  };

  const handleApprove = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchWithdrawals();
    } catch (error) {
      console.error('Failed to approve withdrawal:', error);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchWithdrawals();
    } catch (error) {
      console.error('Failed to reject withdrawal:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchWithdrawals();
    } catch (error) {
      console.error('Failed to complete withdrawal:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pending Review',
      processing: 'Processing',
      completed: 'Completed',
      rejected: 'Rejected'
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

  const columns: Column<WithdrawalRequest>[] = [
    {
      key: 'user',
      label: 'User',
      render: (withdrawal) => (
        <div>
          <div className="font-medium text-gray-900">{withdrawal.user.name}</div>
          <div className="text-sm text-gray-500">{withdrawal.user.email}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (withdrawal) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">{formatCurrency(withdrawal.amount)}</div>
          <div className="text-xs text-gray-500">Fee: {formatCurrency(withdrawal.fee)}</div>
        </div>
      )
    },
    {
      key: 'net_amount',
      label: 'Net Amount',
      sortable: true,
      render: (withdrawal) => (
        <span className="text-sm font-semibold text-green-600">{formatCurrency(withdrawal.net_amount)}</span>
      )
    },
    {
      key: 'bank_details',
      label: 'Bank Account',
      render: (withdrawal) => (
        <div>
          <div className="text-sm text-gray-900">{withdrawal.bank_details.bank_name}</div>
          <div className="text-xs text-gray-500 font-mono">{withdrawal.bank_details.account_number}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (withdrawal) => getStatusBadge(withdrawal.status)
    },
    {
      key: 'requested_at',
      label: 'Requested',
      sortable: true,
      render: (withdrawal) => (
        <span className="text-sm text-gray-900">
          {new Date(withdrawal.requested_at).toLocaleDateString('en-US', {
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
        { value: 'pending', label: 'Pending Review' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'rejected', label: 'Rejected' }
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
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and process user withdrawal requests
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">Total Pending Amount</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {formatCurrency(totalPendingAmount)}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {withdrawals.filter(w => w.status === 'pending').length} pending requests
            </p>
          </div>
          <div className="bg-yellow-200 rounded-full p-4">
            <svg className="w-8 h-8 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ status: '', date_from: '', date_to: '' })}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={withdrawals}
        loading={loading}
        emptyMessage="No withdrawal requests found"
        onSort={handleSort}
        onRowClick={handleRowClick}
        getRowId={(withdrawal) => withdrawal.id}
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
        onComplete={handleComplete}
      />
    </div>
  );
}
