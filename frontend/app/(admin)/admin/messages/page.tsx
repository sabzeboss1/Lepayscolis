'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Conversation {
  id: string;
  user1: {
    id: string;
    name: string;
    email: string;
    messaging_banned: boolean;
    messaging_ban_reason?: string;
  };
  user2: {
    id: string;
    name: string;
    email: string;
    messaging_banned: boolean;
    messaging_ban_reason?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  messages_count?: number;
  shipment_id?: string;
  created_at: string;
  updated_at: string;
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
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.search && typeof filters.search === 'string') {
        params.search = filters.search;
      }

      const data = await apiClient.get<any>(API_ENDPOINTS.admin.messages.list, { params });
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
        <div className="space-y-1">
          <div>
            <span className="font-medium text-gray-900">{conversation.user1?.name || 'Unknown'}</span>
            {conversation.user1?.messaging_banned && (
              <span className="ml-2 text-xs text-red-600">(Banned)</span>
            )}
          </div>
          <div className="text-gray-500">& </div>
          <div>
            <span className="font-medium text-gray-900">{conversation.user2?.name || 'Unknown'}</span>
            {conversation.user2?.messaging_banned && (
              <span className="ml-2 text-xs text-red-600">(Banned)</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'last_message',
      label: t('admin.messages.lastMessage'),
      render: (conversation) => (
        <div>
          {conversation.last_message ? (
            <>
              <div className="text-sm text-gray-900 truncate max-w-md">
                {conversation.last_message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(conversation.last_message.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-500">No messages</span>
          )}
        </div>
      )
    },
    {
      key: 'message_count',
      label: t('admin.messages.messageCount'),
      render: (conversation) => (
        <span className="text-sm text-gray-900">{conversation.messages_count || 0}</span>
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
