'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { NotificationService } from '@/lib/services/NotificationService';
import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages';
import { Button } from '@/components/ui/Button';
import type { Message, Conversation } from '@/lib/types/api';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const CHARACTER_LIMIT = 500;

  // Fetch conversation and messages
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  // Setup real-time message listener
  useRealtimeMessages({
    conversationId,
    onNewMessage: (newMessage: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Mark as read if it's from another user
      if (newMessage.sender_id !== user?.id && !newMessage.is_read) {
        markMessageAsRead(newMessage.id);
      }
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (messages.length > 0) {
      markUnreadMessagesAsRead();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const response = await apiClient.get<{ data: Conversation[] }>(
        API_ENDPOINTS.messages.conversations
      );
      
      const conv = response.data.find((c) => c.id === conversationId);
      if (conv) {
        setConversation(conv);
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{ data: Message[] }>(
        `${API_ENDPOINTS.messages.list}?conversation_id=${conversationId}`
      );

      setMessages(response.data || []);
    } catch (err) {
      const errorMessage = ErrorHandler.handle(err);
      setError(errorMessage);
      NotificationService.error(errorMessage, t('messages.errorFetchingMessages'));
    } finally {
      setLoading(false);
    }
  };

  const markUnreadMessagesAsRead = async () => {
    const unreadMessages = messages.filter(
      (m) => !m.is_read && m.sender_id !== user?.id
    );

    for (const message of unreadMessages) {
      await markMessageAsRead(message.id);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await apiClient.put(API_ENDPOINTS.messages.markRead(messageId));
      
      // Update local state
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || sending || !conversation) return;

    const recipientId = conversation.participants.find((p) => p.id !== user?.id)?.id;
    if (!recipientId) {
      NotificationService.error(t('messages.errorNoRecipient'));
      return;
    }

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user?.id || '',
      sender: user!,
      content: messageInput.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');

    try {
      setSending(true);

      const response = await apiClient.post<{ data: Message }>(
        API_ENDPOINTS.messages.send,
        {
          recipient_id: recipientId,
          content: optimisticMessage.content,
          conversation_id: conversationId,
        }
      );

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? response.data : m))
      );

      NotificationService.success(t('messages.messageSent'));
    } catch (err) {
      // Rollback on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setMessageInput(optimisticMessage.content);

      const errorMessage = ErrorHandler.handle(err);
      NotificationService.error(errorMessage, t('messages.errorSendingMessage'));
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const otherParticipant = conversation?.participants.find((p) => p.id !== user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← {t('common.back')}
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2"
            aria-label={t('common.back')}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
              {otherParticipant?.name.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                {otherParticipant?.name || t('messages.unknownUser')}
              </h1>
              {otherParticipant?.is_verified && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('profile.verified')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>{t('messages.noMessagesYet')}</p>
              <p className="text-sm mt-2">{t('messages.startConversation')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={`text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                      {isOwnMessage && (
                        <span className="text-xs text-blue-100">
                          {message.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 bg-gray-50"
        >
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={messageInput}
                onChange={(e) => {
                  if (e.target.value.length <= CHARACTER_LIMIT) {
                    setMessageInput(e.target.value);
                  }
                }}
                placeholder={t('messages.typeMessage')}
                disabled={sending}
                rows={1}
                className="w-full px-4 py-3 min-h-[44px] max-h-32 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                aria-label={t('messages.typeMessage')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {messageInput.length}/{CHARACTER_LIMIT}
              </p>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!messageInput.trim() || sending}
              loading={sending}
              className="min-h-[44px]"
            >
              {t('messages.send')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
