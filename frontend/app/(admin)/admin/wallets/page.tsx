'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';

interface Wallet {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
  total_credits: number;
  total_debits: number;
  last_transaction_at?: string;
}

export default function WalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<string>('balance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    search: '',
    sort_by: 'balance_high'
  });

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/wallets?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data.data is an array
      setWallets(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      setWallets([]); // Set empty array on error
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [currentPage, perPage, sortKey, sortDirection, filters]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters as typeof filters);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const columns: Column<Wallet>[] = [
    {
      key: 'user',
      label: 'User',
      render: (wallet) => (
        <div>
          <div className="font-medium text-gray-900">{wallet.user.name}</div>
          <div className="text-sm text-gray-500">{wallet.user.email}</div>
        </div>
      )
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (wallet) => (
        <span className={`text-sm font-semibold ${
          wallet.balance > 0 ? 'text-green-600' : wallet.balance < 0 ? 'text-red-600' : 'text-gray-900'
        }`}>
          {formatCurrency(wallet.balance)}
        </span>
      )
    },
    {
      key: 'total_credits',
      label: 'Total Credits',
      sortable: true,
      render: (wallet) => (
        <span className="text-sm text-gray-900">{formatCurrency(wallet.total_credits)}</span>
      )
    },
    {
      key: 'total_debits',
      label: 'Total Debits',
      sortable: true,
      render: (wallet) => (
        <span className="text-sm text-gray-900">{formatCurrency(wallet.total_debits)}</span>
      )
    },
    {
      key: 'last_transaction_at',
      label: 'Last Transaction',
      sortable: true,
      render: (wallet) => (
        <span className="text-sm text-gray-900">
          {wallet.last_transaction_at
            ? new Date(wallet.last_transaction_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'No transactions'}
        </span>
      )
    }
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'text' as const,
      key: 'search',
      label: 'Search',
      placeholder: 'Search by user name or email...'
    },
    {
      type: 'select' as const,
      key: 'sort_by',
      label: 'Sort By',
      options: [
        { value: 'balance_high', label: 'Balance: High to Low' },
        { value: 'balance_low', label: 'Balance: Low to High' },
        { value: 'credits_high', label: 'Credits: High to Low' },
        { value: 'debits_high', label: 'Debits: High to Low' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage user wallet balances and transactions
        </p>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '', sort_by: 'balance_high' })}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={wallets}
        loading={loading}
        emptyMessage="No wallets found"
        onSort={handleSort}
        onRowClick={(wallet) => router.push(`/admin/wallets/${wallet.user.id}`)}
        getRowId={(wallet) => wallet.id}
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
