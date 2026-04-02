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
import { MessageCircle, ShieldCheck } from 'lucide-react';
import type { Conversation } from '@/lib/types/message';

/* ─── helpers ─────────────────────────────────────────── */

function formatMessageTime(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ─── avatar ─────────────────────────────────────────── */

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-12 h-12 rounded-2xl object-cover shrink-0"
        style={{ border: '2px solid var(--color-light-border)' }}
      />
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
      style={{ background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)' }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── page ────────────────────────────────────────────── */

export default function MessagesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const errorResponse = ErrorHandler.handle(err);
      setError(errorResponse.message);
      NotificationService.error(errorResponse.message, t('messages.errorFetchingConversations'));
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  /* ── loading ── */
  if (loading) {
    return (
      <KYCBlocker action="envoyer des messages">
        <div className="min-h-screen bg-soft-gray">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="mb-6">
              <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse mb-1" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
                  style={{ background: '#fff', border: '1px solid var(--color-light-border)' }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="h-3 w-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  /* ── error ── */
  if (error) {
    return (
      <KYCBlocker action="envoyer des messages">
        <div className="min-h-screen bg-soft-gray flex items-center justify-center p-4">
          <div
            className="max-w-md w-full p-8 rounded-2xl text-center"
            style={{ background: '#fff', border: '1px solid var(--color-light-border)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <MessageCircle className="w-8 h-8" style={{ color: '#EF4444' }} />
            </div>
            <p className="text-body-text">{error}</p>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  return (
    <KYCBlocker action="envoyer des messages">
      <div className="min-h-screen bg-soft-gray">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1 h-6 rounded-full"
                style={{ background: 'linear-gradient(180deg, var(--color-royal-blue), var(--color-vibrant-orange))' }}
                aria-hidden="true"
              />
              <h1
                className="text-2xl font-bold text-navy"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('messages.title')}
              </h1>
            </div>
            <p className="text-sm ml-3" style={{ color: 'var(--color-muted-text)' }}>
              {conversations.length > 0
                ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`
                : 'Aucune conversation'}
            </p>
          </div>

          {/* Empty state */}
          {conversations.length === 0 ? (
            <div
              className="rounded-2xl p-12 flex flex-col items-center text-center gap-4"
              style={{ background: '#fff', border: '1px solid var(--color-light-border)' }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(249,115,22,0.08))',
                  border: '1px solid var(--color-light-border)',
                }}
              >
                <MessageCircle className="w-9 h-9" style={{ color: 'var(--color-royal-blue)' }} />
              </div>
              <div>
                <p className="font-semibold text-navy">{t('messages.noConversations')}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted-text)' }}>
                  {t('messages.startConversationHint')}
                </p>
              </div>
            </div>
          ) : (
            /* Conversation list */
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const other = conversation.other_user;
                const hasUnread = conversation.unread_count > 0;
                const lastMsg = conversation.last_message;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className="w-full text-left flex items-center gap-4 p-4 rounded-2xl transition-all group"
                    style={{
                      background: hasUnread
                        ? 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(249,115,22,0.02))'
                        : '#fff',
                      border: hasUnread
                        ? '1.5px solid rgba(37,99,235,0.15)'
                        : '1px solid var(--color-light-border)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar name={other?.name || '?'} src={other?.avatar} />
                      {hasUnread && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: 'var(--color-vibrant-orange)' }}
                          aria-label={`${conversation.unread_count} non lus`}
                        >
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-bold truncate"
                          style={{ color: hasUnread ? 'var(--color-navy)' : 'var(--color-navy)' }}
                        >
                          {other?.name || t('messages.unknownUser')}
                        </span>
                        {other?.kyc_status === 'approved' && (
                          <ShieldCheck
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: 'var(--color-royal-blue)' }}
                            aria-label="Vérifié"
                          />
                        )}
                      </div>
                      {lastMsg && (
                        <p
                          className="text-xs truncate mt-0.5"
                          style={{
                            color: hasUnread ? 'var(--color-body-text)' : 'var(--color-muted-text)',
                            fontWeight: hasUnread ? 600 : 400,
                          }}
                        >
                          {lastMsg.sender_id === user?.id && (
                            <span style={{ color: 'var(--color-muted-text)' }}>
                              {t('messages.you')}&nbsp;
                            </span>
                          )}
                          {lastMsg.content}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    {lastMsg && (
                      <span
                        className="text-[11px] shrink-0"
                        style={{ color: hasUnread ? 'var(--color-royal-blue)' : 'var(--color-muted-text)', fontWeight: hasUnread ? 600 : 400 }}
                      >
                        {formatMessageTime(lastMsg.created_at)}
                      </span>
                    )}
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
