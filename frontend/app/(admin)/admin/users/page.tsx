'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import BulkActions, { BulkAction } from '@/components/admin/BulkActions';
import CreateUserModal from '@/components/admin/CreateUserModal';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'suspended';
  kyc_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  last_login?: string;
}

interface UserFilterValues {
  [key: string]: string;
  search: string;
  status: string;
  kyc_status: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<UserFilterValues>({
    search: '',
    status: '',
    kyc_status: ''
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.kyc_status && { kyc_status: filters.kyc_status })
      });

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }

      if (data && data.meta && typeof data.meta.total === 'number') {
        setTotal(data.meta.total);
      } else {
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, perPage, sortKey, sortDirection, filters]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleFilterChange = (newFilters: { [key: string]: string | { from: string; to: string } }) => {
    setFilters(newFilters as UserFilterValues);
    setCurrentPage(1);
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(users.map(user => user.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkAction = async (actionKey: string) => {
    const selectedIds = Array.from(selectedRows);

    try {
      if (actionKey === 'suspend') {
        await fetch('/api/admin/users/bulk-suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: selectedIds })
        });
      } else if (actionKey === 'activate') {
        await fetch('/api/admin/users/bulk-activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: selectedIds })
        });
      }

      fetchUsers();
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {t(`admin.users.statuses.${status}`)}
      </span>
    );
  };

  const getKYCBadge = (status: string) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {t(`admin.users.kycStatuses.${status}`)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      user: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      super_admin: 'bg-pink-100 text-pink-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[role as keyof typeof badges]}`}>
        {t(`admin.users.roles.${role}`)}
      </span>
    );
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: t('admin.users.columns.name'),
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      key: 'phone',
      label: t('admin.users.columns.phone'),
      render: (user) => <span className="text-sm text-gray-900">{user.phone}</span>
    },
    {
      key: 'role',
      label: t('admin.users.columns.role'),
      sortable: true,
      render: (user) => getRoleBadge(user.role)
    },
    {
      key: 'status',
      label: t('admin.users.columns.status'),
      sortable: true,
      render: (user) => getStatusBadge(user.status)
    },
    {
      key: 'kyc_status',
      label: t('admin.users.columns.kycStatus'),
      sortable: true,
      render: (user) => getKYCBadge(user.kyc_status)
    },
    {
      key: 'created_at',
      label: t('admin.users.columns.joined'),
      sortable: true,
      render: (user) => (
        <span className="text-sm text-gray-900">
          {new Date(user.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ];

  const filterConfig: FilterConfig[] = [
    {
      key: 'search',
      type: 'text' as const,
      label: t('admin.users.filters.search'),
      placeholder: t('admin.users.filters.searchPlaceholder')
    },
    {
      key: 'status',
      type: 'select' as const,
      label: t('admin.users.filters.status'),
      options: [
        { value: 'active', label: t('admin.users.statuses.active') },
        { value: 'suspended', label: t('admin.users.statuses.suspended') }
      ]
    },
    {
      key: 'kyc_status',
      type: 'select' as const,
      label: t('admin.users.filters.kycStatus'),
      options: [
        { value: 'pending', label: t('admin.users.kycStatuses.pending') },
        { value: 'approved', label: t('admin.users.kycStatuses.approved') },
        { value: 'rejected', label: t('admin.users.kycStatuses.rejected') }
      ]
    }
  ];

  const bulkActions: BulkAction[] = [
    { key: 'suspend', label: t('admin.users.bulk.suspendSelected'), variant: 'danger' as const },
    { key: 'activate', label: t('admin.users.bulk.activateSelected'), variant: 'default' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t('admin.users.addUser')}
        </button>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '', status: '', kyc_status: '' })}
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
        data={users}
        loading={loading}
        emptyMessage={t('admin.users.noUsers')}
        onSort={handleSort}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        getRowId={(user) => user.id}
        selectable={true}
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(total / perPage)}
        totalItems={total}
        itemsPerPage={perPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
        }}
      />
    </div>
  );
}
