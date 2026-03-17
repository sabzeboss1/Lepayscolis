'use client';

import { useState, useEffect } from 'react';
import { Shield, Download } from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';

interface AuditLog {
  id: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  before?: any;
  after?: any;
  created_at: string;
}

interface FilterValues {
  [key: string]: string | { from: string; to: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    action: '',
    resource: '',
    dateRange: { from: '', to: '' }
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filterValues.action && typeof filterValues.action === 'string' && { action: filterValues.action }),
        ...(filterValues.resource && typeof filterValues.resource === 'string' && { resource: filterValues.resource }),
        ...(filterValues.search && typeof filterValues.search === 'string' && { search: filterValues.search }),
      });

      const dateRange = filterValues.dateRange;
      if (dateRange && typeof dateRange === 'object' && 'from' in dateRange) {
        if (dateRange.from) params.append('date_from', dateRange.from);
        if (dateRange.to) params.append('date_to', dateRange.to);
      }

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const result = await response.json();

      setLogs(result.data || []);
      setTotalLogs(result.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage, filterValues]);

  const handleFilterChange = (newValues: FilterValues) => {
    setFilterValues(newValues);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterValues({
      search: '',
      action: '',
      resource: '',
      dateRange: { from: '', to: '' }
    });
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const csvContent = [
        ['Admin', 'Email', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Date'],
        ...logs.map(log => [
          log.admin.name,
          log.admin.email,
          log.action,
          log.resource_type,
          log.resource_id,
          log.ip_address,
          new Date(log.created_at).toLocaleString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      approve: 'bg-purple-100 text-purple-800',
      reject: 'bg-orange-100 text-orange-800',
      suspend: 'bg-yellow-100 text-yellow-800',
      activate: 'bg-teal-100 text-teal-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[action] || 'bg-gray-100 text-gray-800'}`}>
        {action}
      </span>
    );
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'admin',
      label: 'Admin',
      render: (log) => (
        <div>
          <div className="font-medium text-gray-900">{log.admin.name}</div>
          <div className="text-sm text-gray-500">{log.admin.email}</div>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (log) => getActionBadge(log.action)
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (log) => (
        <div>
          <div className="font-medium text-gray-900">{log.resource_type}</div>
          <div className="text-xs text-gray-500 font-mono">{log.resource_id.substring(0, 12)}...</div>
        </div>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (log) => (
        <span className="font-mono text-sm text-gray-700">{log.ip_address}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (log) => (
        <div className="text-sm text-gray-900">
          {new Date(log.created_at).toLocaleString()}
        </div>
      )
    }
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      type: 'text',
      label: 'Search Resource ID',
      placeholder: 'Search by resource ID...'
    },
    {
      key: 'action',
      type: 'select',
      label: 'Action',
      options: [
        { value: '', label: 'All Actions' },
        { value: 'create', label: 'Create' },
        { value: 'update', label: 'Update' },
        { value: 'delete', label: 'Delete' },
        { value: 'approve', label: 'Approve' },
        { value: 'reject', label: 'Reject' },
        { value: 'suspend', label: 'Suspend' },
        { value: 'activate', label: 'Activate' }
      ]
    },
    {
      key: 'resource',
      type: 'select',
      label: 'Resource Type',
      options: [
        { value: '', label: 'All Resources' },
        { value: 'user', label: 'User' },
        { value: 'trip', label: 'Trip' },
        { value: 'shipment', label: 'Shipment' },
        { value: 'payment', label: 'Payment' },
        { value: 'kyc', label: 'KYC' },
        { value: 'withdrawal', label: 'Withdrawal' },
        { value: 'settings', label: 'Settings' }
      ]
    },
    {
      key: 'dateRange',
      type: 'daterange',
      label: 'Date Range'
    }
  ];

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600 mt-1">
              View all administrative actions and changes
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          {exportLoading ? 'Exporting...' : 'Export Logs'}
        </button>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No audit logs found"
        getRowId={(log) => log.id}
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalLogs}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newPerPage: number) => {
          setItemsPerPage(newPerPage);
          setCurrentPage(1);
        }}
      />

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">About Audit Logs</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>All administrative actions are automatically logged</li>
          <li>Logs include before and after values for updates</li>
          <li>Audit logs are immutable and cannot be modified or deleted</li>
          <li>IP addresses are tracked for security monitoring</li>
          <li>Export respects all active filters</li>
        </ul>
      </div>
    </div>
  );
}
