'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import BulkActions, { BulkAction } from '@/components/admin/BulkActions';
import KYCReviewModal from '@/components/admin/KYCReviewModal';

interface KYCSubmission {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  document_type: 'idCard' | 'passport' | 'driversLicense';
  document_number: string;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
}

interface KYCFilterValues {
  [key: string]: string;
  status: string;
}

export default function KYCPage() {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [filters, setFilters] = useState<KYCFilterValues>({
    status: ''
  });

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(`/api/admin/kyc?${params}`);
      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        // Map API response to flatten documents array into top-level fields
        const mapped = data.data.map((item: any) => {
          const doc = item.documents?.[0];
          return {
            ...item,
            document_front_url: doc?.front_url || null,
            document_back_url: doc?.back_url || null,
            selfie_url: doc?.selfie_url || null,
          };
        });
        setSubmissions(mapped);
      } else {
        setSubmissions([]);
      }

      if (data && data.meta && typeof data.meta.total === 'number') {
        setTotal(data.meta.total);
      } else {
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
      setSubmissions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, perPage, sortBy, filters]);

  const handleFilterChange = (newFilters: { [key: string]: string | { from: string; to: string } }) => {
    setFilters(newFilters as KYCFilterValues);
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
      setSelectedRows(new Set(submissions.map(sub => sub.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowClick = (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleApprove = async (id: string) => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
      
      const response = await fetch(`/api/admin/kyc/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve KYC');
      }
      
      fetchSubmissions();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      alert('Failed to approve KYC. Please try again.');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
      
      const response = await fetch(`/api/admin/kyc/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject KYC');
      }
      
      fetchSubmissions();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert('Failed to reject KYC. Please try again.');
    }
  };

  const handleBulkAction = async (actionKey: string) => {
    const selectedIds = Array.from(selectedRows);

    try {
      if (actionKey === 'approve') {
        await fetch('/api/admin/kyc/bulk-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        });
      } else if (actionKey === 'reject') {
        await fetch('/api/admin/kyc/bulk-reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds, reason: 'Bulk rejection by admin' })
        });
      }

      fetchSubmissions();
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {t(`admin.kyc.statuses.${status}`)}
      </span>
    );
  };

  const columns: Column<KYCSubmission>[] = [
    {
      key: 'user',
      label: t('admin.kyc.columns.user'),
      render: (submission) => (
        <div>
          <div className="font-medium text-gray-900">{submission.user.name}</div>
          <div className="text-sm text-gray-500">{submission.user.email}</div>
        </div>
      )
    },
    {
      key: 'document_type',
      label: t('admin.kyc.columns.documentType'),
      render: (submission) => (
        <span className="text-sm text-gray-900">
          {t(`admin.kyc.documentTypes.${submission.document_type}`)}
        </span>
      )
    },
    {
      key: 'document_number',
      label: t('admin.kyc.columns.documentNumber'),
      render: (submission) => (
        <span className="text-sm text-gray-900 font-mono">{submission.document_number}</span>
      )
    },
    {
      key: 'status',
      label: t('admin.kyc.columns.status'),
      sortable: true,
      render: (submission) => getStatusBadge(submission.status)
    },
    {
      key: 'submitted_at',
      label: t('admin.kyc.columns.submitted'),
      sortable: true,
      render: (submission) => (
        <span className="text-sm text-gray-900">
          {new Date(submission.submitted_at).toLocaleDateString(undefined, {
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

  const filterConfig: FilterConfig[] = [
    {
      key: 'status',
      type: 'select' as const,
      label: t('admin.kyc.filters.status'),
      options: [
        { value: 'pending', label: t('admin.kyc.statuses.pending') },
        { value: 'approved', label: t('admin.kyc.statuses.approved') },
        { value: 'rejected', label: t('admin.kyc.statuses.rejected') }
      ]
    }
  ];

  const bulkActions: BulkAction[] = [
    { key: 'approve', label: t('admin.kyc.bulk.approveSelected'), variant: 'default' as const },
    { key: 'reject', label: t('admin.kyc.bulk.rejectSelected'), variant: 'danger' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.kyc.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('admin.kyc.subtitle')}
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
            {t('admin.kyc.sortBy')}:
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'newest' | 'oldest');
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">{t('admin.kyc.sortNewest')}</option>
            <option value="oldest">{t('admin.kyc.sortOldest')}</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ status: '' })}
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
        data={submissions}
        loading={loading}
        emptyMessage={t('admin.kyc.noSubmissions')}
        onRowClick={handleRowClick}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        getRowId={(submission) => submission.id}
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

      {/* Review Modal */}
      <KYCReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
