'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { NotificationService } from '@/lib/services/NotificationService';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import type { Conversation } from '@/lib/types/api';

export default function MessagesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations from API
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<{ data: Conversation[] }>(
        API_ENDPOINTS.messages.conversations
      );
      
      setConversations(response.data || []);
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err);
      setError(errorMessage);
      NotificationService.error(errorMessage, t('messages.errorFetchingConversations'));
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  if (loading) {
    return (
      <KYCBlocker action="envoyer des messages">
        <div className="min-h-screen bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{t('messages.title')}</h1>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  if (error) {
    return (
      <KYCBlocker action="envoyer des messages">
        <div className="min-h-screen bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{t('messages.title')}</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  return (
    <KYCBlocker action="envoyer des messages">
      <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">{t('messages.title')}</h1>

        {conversations.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">{t('messages.noConversations')}</p>
            <p className="text-gray-500 text-sm mt-2">
              {t('messages.startConversationHint')}
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (p) => p.id !== user?.id
              );
              const hasUnread = conversation.unread_count > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                        {otherParticipant?.name.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <span
                          className={`font-medium ${
                            hasUnread ? 'text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {otherParticipant?.name || t('messages.unknownUser')}
                        </span>
                        {conversation.last_message && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatMessageTime(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>

                      {conversation.last_message && (
                        <p
                          className={`text-sm line-clamp-2 ${
                            hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {conversation.last_message.sender_id === user?.id && (
                            <span className="text-gray-500">{t('messages.you')}: </span>
                          )}
                          {conversation.last_message.content}
                        </p>
                      )}

                      {hasUnread && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {conversation.unread_count}{' '}
                            {conversation.unread_count === 1
                              ? t('messages.unreadMessage')
                              : t('messages.unreadMessages')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </KYCBlocker>
  );
}
