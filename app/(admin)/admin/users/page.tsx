'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, UserPlus } from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import BulkActions from '@/components/admin/BulkActions';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'suspended';
  kyc_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  created_at: string;
  last_login?: string;
}

interface FilterValues {
  search: string;
  status: string;
  role: string;
  kyc_status: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: '',
    role: '',
    kyc_status: ''
  });

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
        ...(filters.role && { role: filters.role }),
        ...(filters.kyc_status && { kyc_status: filters.kyc_status })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add null checks for data structure
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

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters as FilterValues);
    setCurrentPage(1); // Reset to first page on filter change
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

  const handleBulkAction = async (action: string) => {
    const selectedIds = Array.from(selectedRows);
    
    try {
      if (action === 'suspend') {
        // Bulk suspend users
        await fetch('/api/admin/users/bulk-suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: selectedIds })
        });
      } else if (action === 'activate') {
        // Bulk activate users
        await fetch('/api/admin/users/bulk-activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: selectedIds })
        });
      }
      
      // Refresh data and clear selection
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
        {status}
      </span>
    );
  };

  const getKYCBadge = (status: string) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      not_submitted: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
      not_submitted: 'Not Submitted'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      user: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      super_admin: 'bg-pink-100 text-pink-800'
    };
    const labels = {
      user: 'User',
      admin: 'Admin',
      super_admin: 'Super Admin'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[role as keyof typeof badges]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
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
      label: 'Phone',
      render: (user) => <span className="text-sm text-gray-900">{user.phone}</span>
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => getRoleBadge(user.role)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (user) => getStatusBadge(user.status)
    },
    {
      key: 'kyc_status',
      label: 'KYC Status',
      sortable: true,
      render: (user) => getKYCBadge(user.kyc_status)
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-gray-900">
          {new Date(user.created_at).toLocaleDateString('en-US', {
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
      label: 'Search',
      placeholder: 'Search by name, email, or phone...'
    },
    {
      key: 'status',
      type: 'select' as const,
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' }
      ]
    },
    {
      key: 'role',
      type: 'select' as const,
      label: 'Role',
      options: [
        { value: '', label: 'All Roles' },
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
        { value: 'super_admin', label: 'Super Admin' }
      ]
    },
    {
      key: 'kyc_status',
      type: 'select' as const,
      label: 'KYC Status',
      options: [
        { value: '', label: 'All KYC Statuses' },
        { value: 'approved', label: 'Approved' },
        { value: 'pending', label: 'Pending' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'not_submitted', label: 'Not Submitted' }
      ]
    }
  ];

  const bulkActions = [
    { value: 'suspend', label: 'Suspend Selected', variant: 'danger' as const },
    { value: 'activate', label: 'Activate Selected', variant: 'default' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage platform users and their accounts
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/users/new')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '', status: '', role: '', kyc_status: '' })}
      />

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <BulkActions
          selectedCount={selectedRows.size}
          actions={bulkActions}
          onAction={handleBulkAction}
          onClear={() => setSelectedRows(new Set())}
        />
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
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
