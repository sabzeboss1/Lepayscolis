'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import BulkActions, { BulkAction } from '@/components/admin/BulkActions';
import CreateUserModal from '@/components/admin/CreateUserModal';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';

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
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === 'super_admin';
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
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
      const token = authCookie ? decodeURIComponent(authCookie.split('=')[1]) : null;

      if (!token) {
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.admin.users.export}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: filters.status || undefined,
          kyc_status: filters.kyc_status || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export failed:', response.status, errorText);
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `utilisateurs_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Échec de l\'export. Veuillez réessayer.');
    } finally {
      setExporting(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortKey,
        sort_direction: sortDirection,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.kyc_status) params.kyc_status = filters.kyc_status;

      const data = await apiClient.get<{ data: User[]; meta: { total: number } }>(
        API_ENDPOINTS.admin.users.list,
        { params }
      );

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
        await apiClient.post<any>(API_ENDPOINTS.admin.users.bulkSuspend, { 
          user_ids: selectedIds 
        });
      } else if (actionKey === 'activate') {
        await apiClient.post<any>(API_ENDPOINTS.admin.users.bulkActivate, { 
          user_ids: selectedIds 
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
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {exporting ? 'Export en cours...' : 'Export Excel'}
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t('admin.users.addUser')}
          </button>
        </div>
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
