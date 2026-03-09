'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  last_message: {
    content: string;
    sent_at: string;
  };
  message_count: number;
  reported_count: number;
  has_reported_messages: boolean;
}

interface FilterValues {
  search: string;
  reported_only: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    reported_only: ''
  });

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.reported_only && { reported_only: filters.reported_only })
      });

      const response = await fetch(`/api/admin/messages?${params}`);
      const data = await response.json();
      
      setConversations(data.data);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentPage, perPage, filters]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const columns: Column<Conversation>[] = [
    {
      key: 'participants',
      label: 'Participants',
      render: (conversation) => (
        <div>
          {conversation.participants.map((participant, index) => (
            <div key={participant.id}>
              <span className="font-medium text-gray-900">{participant.name}</span>
              {index < conversation.participants.length - 1 && (
                <span className="text-gray-500"> & </span>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'last_message',
      label: 'Last Message',
      render: (conversation) => (
        <div>
          <div className="text-sm text-gray-900 truncate max-w-md">
            {conversation.last_message.content}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(conversation.last_message.sent_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      )
    },
    {
      key: 'message_count',
      label: 'Messages',
      render: (conversation) => (
        <span className="text-sm text-gray-900">{conversation.message_count}</span>
      )
    },
    {
      key: 'reported_count',
      label: 'Reports',
      render: (conversation) => (
        conversation.has_reported_messages ? (
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm font-semibold text-red-600">{conversation.reported_count}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">0</span>
        )
      )
    }
  ];

  const filterConfig = [
    {
      type: 'text' as const,
      name: 'search',
      label: 'Search',
      placeholder: 'Search by participant name...',
      value: filters.search
    },
    {
      type: 'select' as const,
      name: 'reported_only',
      label: 'Filter',
      value: filters.reported_only,
      options: [
        { value: '', label: 'All Conversations' },
        { value: 'yes', label: 'Reported Messages Only' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Message Moderation</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitor conversations and moderate reported messages
        </p>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '', reported_only: '' })}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={conversations}
        loading={loading}
        emptyMessage="No conversations found"
        onRowClick={(conversation) => router.push(`/admin/messages/${conversation.id}`)}
        getRowId={(conversation) => conversation.id}
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
