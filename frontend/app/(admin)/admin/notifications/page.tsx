'use client';

import { useState, useEffect } from 'react';
import { Bell, Send } from 'lucide-react';
import NotificationForm from '@/components/admin/NotificationForm';
import TablePagination from '@/components/admin/TablePagination';

interface NotificationHistory {
  id: string;
  sent_by: {
    id: string;
    name: string;
  };
  recipient_type: 'individual' | 'broadcast' | 'group';
  recipient_count: number;
  title: string;
  message: string;
  sent_at: string;
}

export default function NotificationsPage() {
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString()
      });

      const response = await fetch(`/api/admin/notifications/history?${params}`);
      const data = await response.json();
      
      setHistory(data.data);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (notificationData: any) => {
    try {
      await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });
      setShowForm(false);
      fetchHistory();
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  };

  const getRecipientTypeBadge = (type: string) => {
    const badges = {
      individual: 'bg-blue-100 text-blue-800',
      broadcast: 'bg-purple-100 text-purple-800',
      group: 'bg-green-100 text-green-800'
    };
    const labels = {
      individual: 'Individual',
      broadcast: 'Broadcast',
      group: 'Group'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[type as keyof typeof badges]}`}>
        {labels[type as keyof typeof labels]}
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
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600 mt-1">
              Send notifications to users and view history
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4 mr-2" />
          {showForm ? 'Hide Form' : 'Send Notification'}
        </button>
      </div>

      {/* Notification Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Send New Notification</h2>
          </div>
          <div className="p-6">
            <NotificationForm
              onSend={handleSendNotification}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notification History</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No notifications sent yet</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{notification.title}</span>
                    </td>
                    <td className="px-6 py-4">
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
                      <span className="text-sm text-gray-900">{notification.sent_by.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {new Date(notification.sent_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
          perPage={perPage}
          total={total}
          onPageChange={setCurrentPage}
          onPerPageChange={() => {}}
        />
      )}

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">Notification Guidelines</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Title is limited to 100 characters</li>
          <li>Message is limited to 500 characters</li>
          <li>Broadcast notifications are sent to all active users</li>
          <li>Group notifications can be filtered by status, role, or KYC status</li>
          <li>Preview your notification before sending</li>
          <li>All notifications are logged in the audit trail</li>
        </ul>
      </div>
    </div>
  );
}
