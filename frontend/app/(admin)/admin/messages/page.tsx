'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import { useTranslation } from '@/lib/i18n';

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
}

export default function MessagesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, string | { from: string; to: string }>>({
    search: '',
  });

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(filters.search && typeof filters.search === 'string' && { search: filters.search }),
      });

      const response = await fetch(`/api/admin/messages?${params}`);
      const data = await response.json();

      setConversations(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentPage, perPage, filters]);

  const handleFilterChange = (newFilters: Record<string, string | { from: string; to: string }>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const columns: Column<Conversation>[] = [
    {
      key: 'participants',
      label: t('admin.messages.participants'),
      render: (conversation) => (
        <div>
          {conversation.participants.map((participant, index) => (
            <div key={participant.id || index}>
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
      label: t('admin.messages.lastMessage'),
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
      label: t('admin.messages.messageCount'),
      render: (conversation) => (
        <span className="text-sm text-gray-900">{conversation.message_count}</span>
      )
    },
  ];

  const filterConfig = [
    {
      type: 'text' as const,
      key: 'search',
      label: t('common.search'),
      placeholder: t('admin.messages.searchPlaceholder'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.messages.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('admin.messages.description')}
        </p>
      </div>

      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '' })}
      />

      <DataTable
        columns={columns}
        data={conversations}
        loading={loading}
        emptyMessage={t('admin.messages.noConversations')}
        onRowClick={(conversation) => router.push(`/admin/messages/${conversation.id}`)}
        getRowId={(conversation) => conversation.id}
      />

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
