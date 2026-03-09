'use client';

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import BulkActions from '@/components/admin/BulkActions';
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
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: Array<{
    id: string;
    type: 'idCard' | 'passport' | 'driversLicense';
    front_url: string;
    back_url?: string;
    selfie_url: string;
  }>;
  rejection_reason?: string;
}

interface FilterValues {
  status: string;
  sort_by: string;
}

export default function KYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({
    status: '',
    sort_by: 'newest'
  });

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.sort_by && { sort_by: filters.sort_by })
      });

      const response = await fetch(`/api/admin/kyc?${params}`);
      const data = await response.json();
      
      setSubmissions(data.data);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, perPage, filters]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
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

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'idCard':
        return 'Carte d\'Identité Nationale (CNI)';
      case 'passport':
        return 'Passeport';
      case 'driversLicense':
        return 'Permis de Conduire';
      default:
        return type;
    }
  };

  const handleRowClick = (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/admin/kyc/${id}/approve`, {
        method: 'POST'
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to approve KYC:', error);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await fetch(`/api/admin/kyc/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to reject KYC:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    const selectedIds = Array.from(selectedRows);
    
    try {
      if (action === 'approve') {
        await fetch('/api/admin/kyc/bulk-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        });
      } else if (action === 'reject') {
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
        {status}
      </span>
    );
  };

  const columns: Column<KYCSubmission>[] = [
    {
      key: 'user',
      label: 'User',
      render: (submission) => (
        <div>
          <div className="font-medium text-gray-900">{submission.user.name}</div>
          <div className="text-sm text-gray-500">{submission.user.email}</div>
        </div>
      )
    },
    {
      key: 'document_type',
      label: 'Type de Document',
      render: (submission) => (
        <span className="text-sm text-gray-900">
          {getDocumentTypeLabel(submission.document_type)}
        </span>
      )
    },
    {
      key: 'document_number',
      label: 'Document Number',
      render: (submission) => (
        <span className="text-sm text-gray-900 font-mono">{submission.document_number}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (submission) => getStatusBadge(submission.status)
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      sortable: true,
      render: (submission) => (
        <span className="text-sm text-gray-900">
          {new Date(submission.submitted_at).toLocaleDateString('en-US', {
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
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      type: 'select' as const,
      name: 'sort_by',
      label: 'Sort By',
      value: filters.sort_by,
      options: [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' }
      ]
    }
  ];

  const bulkActions = [
    { value: 'approve', label: 'Approve Selected', variant: 'default' as const },
    { value: 'reject', label: 'Reject Selected', variant: 'danger' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and verify user identity documents
        </p>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ status: '', sort_by: 'newest' })}
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
        data={submissions}
        loading={loading}
        emptyMessage="No KYC submissions found"
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
        perPage={perPage}
        total={total}
        onPageChange={setCurrentPage}
        onPerPageChange={(newPerPage) => {
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
