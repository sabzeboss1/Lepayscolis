'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    email: string;
    messaging_banned: boolean;
  };
  content: string;
  sent_at: string;
}

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
  messages: Message[];
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    params.then(p => setConversationId(p.id));
  }, [params]);

  useEffect(() => {
    if (conversationId) {
      fetchConversationDetails();
    }
  }, [conversationId]);

  const fetchConversationDetails = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const data = await apiClient.get<any>(API_ENDPOINTS.admin.messages.show(conversationId));
      setConversation(data.data);
    } catch (error) {
      console.error('Failed to fetch conversation details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId || !banReason.trim() || banReason.length < 10) {
      return;
    }

    try {
      await apiClient.post<any>(API_ENDPOINTS.admin.users.banMessaging(selectedUserId), { reason: banReason });
      fetchConversationDetails();
      setShowBanDialog(false);
      setSelectedUserId(null);
      setBanReason('');
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await apiClient.post<any>(API_ENDPOINTS.admin.users.unbanMessaging(userId));
      fetchConversationDetails();
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageId || !deleteReason.trim() || deleteReason.length < 10) {
      return;
    }

    try {
      await apiClient.delete<any>(API_ENDPOINTS.admin.messages.delete(selectedMessageId), { params: { reason: deleteReason } });
      fetchConversationDetails();
      setShowDeleteDialog(false);
      setSelectedMessageId(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!conversation || !conversation.user1 || !conversation.user2) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.messages.conversationNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.messages.conversation')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {conversation.user1.name} & {conversation.user2.name}
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[conversation.user1, conversation.user2].filter(Boolean).map((participant) => (
          <div key={participant.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-10 h-10 text-gray-400" />
                <div>
                  <button
                    onClick={() => router.push(`/admin/users/${participant.id}`)}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {participant.name}
                  </button>
                  <p className="text-sm text-gray-500">{participant.email}</p>
                  {participant.messaging_banned && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {t('admin.messages.messagingBanned')}
                      </span>
                      {participant.messaging_ban_reason && (
                        <p className="text-xs text-red-600 mt-1">{participant.messaging_ban_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {participant.messaging_banned ? (
                  <button
                    onClick={() => handleUnbanUser(participant.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3 mr-1.5" />
                    {t('admin.messages.unban')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedUserId(participant.id);
                      setShowBanDialog(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                  >
                    <Ban className="w-3 h-3 mr-1.5" />
                    {t('admin.messages.ban')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.messages.messages')}</h2>
        </div>
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {conversation.messages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">{t('admin.messages.noMessages')}</p>
          ) : (
            conversation.messages.map((message) => (
              <div
                key={message.id}
                className="p-4 rounded-lg bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => router.push(`/admin/users/${message.sender.id}`)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {message.sender.name}
                      </button>
                      {message.sender.messaging_banned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {t('admin.messages.banned')}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(message.sent_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{message.content}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMessageId(message.id);
                      setShowDeleteDialog(true);
                    }}
                    className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title={t('admin.messages.deleteMessage')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ban Dialog */}
      {showBanDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.messages.banDialogTitle')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.messages.banDialogDescription')}
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t('admin.messages.banReasonPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${banReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                {banReason.length} / 10 {t('admin.messages.minimum')}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowBanDialog(false);
                    setSelectedUserId(null);
                    setBanReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={banReason.length < 10}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('admin.messages.banUser')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.messages.deleteDialogTitle')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.messages.deleteDialogDescription')}
            </p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder={t('admin.messages.deleteReasonPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${deleteReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                {deleteReason.length} / 10 {t('admin.messages.minimum')}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedMessageId(null);
                    setDeleteReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteMessage}
                  disabled={deleteReason.length < 10}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('admin.messages.deleteMessage')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
