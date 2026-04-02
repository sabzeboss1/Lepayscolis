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

interface Wallet {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
  currency_code?: string;
  total_credits: number;
  total_debits: number;
  last_transaction_at?: string;
}

interface WalletFilterValues {
  [key: string]: string;
  search: string;
}

export default function WalletsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<WalletFilterValues>({ search: '' });

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.search) params.search = filters.search;

      const data = await apiClient.get(API_ENDPOINTS.admin.wallets.list, { params });
      setWallets(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      setWallets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [currentPage, perPage, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters as WalletFilterValues);
    setCurrentPage(1);
  };

  const { formatCurrency } = useAdminCurrency();

  const columns: Column<Wallet>[] = [
    {
      key: 'user',
      label: t('admin.wallets.columns.user'),
      render: (wallet) => (
        <div>
          <div className="font-medium text-gray-900">{wallet.user.name}</div>
          <div className="text-sm text-gray-500">{wallet.user.email}</div>
        </div>
      ),
    },
    {
      key: 'balance',
      label: t('admin.wallets.columns.balance'),
      sortable: true,
      render: (wallet) => (
        <span
          className={`text-sm font-semibold ${
            wallet.balance > 0
              ? 'text-green-600'
              : wallet.balance < 0
                ? 'text-red-600'
                : 'text-gray-900'
          }`}
        >
          {formatCurrency(wallet.balance, wallet.currency_code)}
        </span>
      ),
    },
    {
      key: 'total_credits',
      label: t('admin.wallets.columns.totalCredits'),
      sortable: true,
      render: (wallet) => (
        <span className="text-sm text-green-600">{formatCurrency(wallet.total_credits, wallet.currency_code)}</span>
      ),
    },
    {
      key: 'total_debits',
      label: t('admin.wallets.columns.totalDebits'),
      sortable: true,
      render: (wallet) => (
        <span className="text-sm text-red-600">{formatCurrency(wallet.total_debits, wallet.currency_code)}</span>
      ),
    },
    {
      key: 'last_transaction_at',
      label: t('admin.wallets.columns.lastTransaction'),
      sortable: true,
      render: (wallet) => (
        <span className="text-sm text-gray-500">
          {wallet.last_transaction_at
            ? new Date(wallet.last_transaction_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : t('admin.wallets.noTransactions')}
        </span>
      ),
    },
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'text',
      key: 'search',
      label: t('admin.wallets.filters.search'),
      placeholder: t('admin.wallets.filters.searchPlaceholder'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.wallets.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('admin.wallets.subtitle')}</p>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters({ search: '' }); setCurrentPage(1); }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={wallets}
        loading={loading}
        emptyMessage={t('admin.wallets.noWallets')}
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
