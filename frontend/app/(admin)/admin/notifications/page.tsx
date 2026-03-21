'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import NotificationForm from '@/components/admin/NotificationForm';
import TablePagination from '@/components/admin/TablePagination';

interface NotificationHistory {
  id: string;
  sent_by: {
    id: number;
    name: string;
  };
  recipient_type: 'individual' | 'broadcast' | 'group';
  recipient_count: number;
  title: string;
  message: string;
  sent_at: string;
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      });
      const response = await fetch(`/api/admin/notifications/history?${params}`);
      const data = await response.json();
      setHistory(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSendNotification = async (notificationData: any) => {
    setSendError(null);
    setSendSuccess(null);
    const response = await fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_type: notificationData.recipient_type,
        title: notificationData.title,
        message: notificationData.message,
        ...(notificationData.recipient_type === 'individual' && { user_id: Number(notificationData.recipient_id) }),
        ...(notificationData.recipient_type === 'group' && notificationData.group_filter && { group_filter: notificationData.group_filter }),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || t('admin.notifications.sendFailed'));
    }
    setSendSuccess(t('admin.notifications.sendSuccess', { count: data.recipient_count }));
    setShowForm(false);
    fetchHistory();
  };

  const getRecipientTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      individual: 'bg-blue-100 text-blue-800',
      broadcast: 'bg-purple-100 text-purple-800',
      group: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.notifications.types.${type}`, { defaultValue: type })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.notifications.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('admin.notifications.description')}</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSendError(null); setSendSuccess(null); }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4 mr-2" />
          {showForm ? t('admin.notifications.hideForm') : t('admin.notifications.sendNotification')}
        </button>
      </div>

      {/* Success / Error banners */}
      {sendSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          {sendSuccess}
        </div>
      )}
      {sendError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          {sendError}
        </div>
      )}

      {/* Notification Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.notifications.sendNew')}</h2>
          </div>
          <div className="p-6">
            <NotificationForm
              onSubmit={handleSendNotification}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.notifications.history')}</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">{t('admin.notifications.noHistory')}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.notifications.columns.title')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.notifications.columns.message')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.notifications.columns.type')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.notifications.columns.recipients')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.notifications.columns.sentBy')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.notifications.columns.date')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{notification.title}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <span className="text-sm text-gray-900 line-clamp-2">{notification.message}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRecipientTypeBadge(notification.recipient_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {notification.recipient_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{notification.sent_by?.name ?? '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(notification.sent_at).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > perPage && (
        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(total / perPage)}
          totalItems={total}
          itemsPerPage={perPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={() => {}}
        />
      )}

      {/* Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">{t('admin.notifications.guidelinesTitle')}</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          {(t('admin.notifications.guidelines', { returnObjects: true }) as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
