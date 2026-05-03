'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { NotificationService } from '@/lib/services/NotificationService';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  MessageCircle,
  Check,
  CheckCheck,
} from 'lucide-react';
import type { Conversation, Message } from '@/lib/types/message';

/* ─── helpers ────────────────────────────────────────────── */

function formatMessageTime(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === todayStr) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getDayKey(dateString: string) {
  return new Date(dateString).toDateString();
}

function isTempId(id: string) {
  return id.startsWith('temp-');
}

/* ─── avatar ─────────────────────────────────────────────── */

function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initials = name.charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--color-light-border)' }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── date separator ────────────────────────────────────── */

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4" role="separator" aria-label={label}>
      <div className="flex-1 h-px" style={{ background: 'var(--color-light-border)' }} />
      <span
        className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
        style={{ color: 'var(--color-muted-text)', background: 'rgba(148,163,184,0.1)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--color-light-border)' }} />
    </div>
  );
}

/* ─── message bubble ─────────────────────────────────────── */

function MessageBubble({
  message,
  isOwn,
  isFirst,
  isLast,
}: {
  message: Message;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isPending = isTempId(message.id);

  const ownRadius = {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: isFirst ? 18 : 6,
    borderBottomRightRadius: isLast ? 6 : 6,
  };
  const otherRadius = {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: isFirst ? 18 : 6,
    borderBottomLeftRadius: isLast ? 6 : 6,
  };

  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
      style={{ marginBottom: isLast ? 8 : 2 }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '10px 14px',
          ...(isOwn
            ? {
                background: 'linear-gradient(135deg, var(--color-royal-blue) 0%, #1e40af 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                ...ownRadius,
              }
            : {
                background: '#ffffff',
                color: 'var(--color-navy)',
                border: '1px solid var(--color-light-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                ...otherRadius,
              }),
          opacity: isPending ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* timestamp + read receipt */}
        <div
          className="flex items-center gap-1 mt-1"
          style={{ justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
        >
          <span
            className="text-[10px]"
            style={{ color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--color-muted-text)' }}
          >
            {formatMessageTime(message.created_at)}
          </span>
          {isOwn && (
            isPending ? (
              <Check className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.5)' }} />
            ) : message.read ? (
              <CheckCheck className="w-3 h-3" style={{ color: '#6ee7b7' }} aria-label="Lu" />
            ) : (
              <Check className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.6)' }} aria-label="Envoyé" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────── */

const CHARACTER_LIMIT = 500;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* fetch */
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  /* real-time removed - using polling system instead */
  // useRealtimeMessages({
  //   conversationId,
  //   onNewMessage: (newMessage: Message) => {
  //     setMessages((prev) => {
  //       if (prev.some((m) => m.id === newMessage.id)) return prev;
  //       return [...prev, newMessage];
  //     });
  //     if (newMessage.sender_id !== user?.id && !newMessage.read) {
  //       markMessageAsRead(newMessage.id);
  //     }
  //   },
  // });

  /* scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* mark unread */
  useEffect(() => {
    if (messages.length > 0) markUnreadMessagesAsRead();
  }, [messages]);

  /* auto-resize textarea */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > CHARACTER_LIMIT) return;
    setMessageInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
    }
  };

  const fetchConversation = async () => {
    try {
      const response = await apiClient.get<{ data: Conversation[] }>(
        API_ENDPOINTS.messages.conversations
      );
      const conv = response.data.find((c) => c.id === conversationId);
      if (conv) setConversation(conv);
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<{ data: Message[] }>(
        `/api/messages/${conversationId}`
      );
      setMessages(response.data || []);
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err);
      setError(errorResponse.message);
      NotificationService.error(errorResponse.message, t('messages.errorFetchingMessages'));
    } finally {
      setLoading(false);
    }
  };

  const markUnreadMessagesAsRead = async () => {
    const unread = messages.filter((m) => !m.read && m.sender_id !== user?.id);
    for (const message of unread) {
      await markMessageAsRead(message.id);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await apiClient.patch(`/api/messages/${messageId}/mark-read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending || !conversation) return;

    const recipientId = conversation.other_user?.id;
    if (!recipientId) {
      NotificationService.error(t('messages.errorNoRecipient'));
      return;
    }

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user?.id || '',
      recipient_id: recipientId,
      sender: user!,
      content: messageInput.trim(),
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? response.data : m))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setMessageInput(optimisticMessage.content);
      const errorResponse = ErrorHandler.handle(err);
      NotificationService.error(errorResponse.message, t('messages.errorSendingMessage'));
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = conversation?.other_user;
  const charsLeft = CHARACTER_LIMIT - messageInput.length;
  const charsNearLimit = charsLeft < 50;

  /* ── group messages by day ── */
  const grouped: Array<{ dayKey: string; dayLabel: string; messages: Message[] }> = [];
  for (const msg of messages) {
    const key = getDayKey(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.dayKey === key) {
      last.messages.push(msg);
    } else {
      grouped.push({ dayKey: key, dayLabel: formatDayLabel(msg.created_at), messages: [msg] });
    }
  }

  /* ── loading ── */
  if (loading) {
    return (
      <div
        className="flex flex-col"
        style={{ height: 'calc(100vh - 64px)', background: 'var(--color-soft-gray)' }}
      >
        {/* skeleton header */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: '#fff', borderBottom: '1px solid var(--color-light-border)' }}
        >
          <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
        {/* skeleton bubbles */}
        <div className="flex-1 p-4 space-y-3">
          {[60, 40, 80, 55, 45].map((w, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div
                className="h-10 rounded-2xl bg-gray-200 animate-pulse"
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 p-8"
        style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--color-soft-gray)' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          <MessageCircle className="w-8 h-8" style={{ color: '#EF4444' }} />
        </div>
        <p className="text-body-text text-center">{error}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: 'var(--color-royal-blue)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 64px)' }}
    >

      {/* ══ HEADER ═════════════════════════════════════════════ */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--color-light-border)',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors group"
          style={{ background: 'rgba(37,99,235,0.06)' }}
          aria-label={t('common.back')}
        >
          <ArrowLeft
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            style={{ color: 'var(--color-royal-blue)' }}
          />
        </button>

        <Avatar
          name={otherParticipant?.name || '?'}
          src={otherParticipant?.avatar}
          size={40}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-navy truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {otherParticipant?.name || t('messages.unknownUser')}
            </h1>
            {otherParticipant?.kyc_status === 'approved' && (
              <ShieldCheck
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: 'var(--color-royal-blue)' }}
                aria-label="Identité vérifiée"
              />
            )}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--color-muted-text)' }}>
            {conversation ? 'Conversation active' : 'Chargement…'}
          </p>
        </div>
      </div>

      {/* ══ MESSAGES ════════════════════════════════════════════ */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: 'var(--color-soft-gray)' }}
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {messages.length === 0 ? (
          /* ── empty state ── */
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(249,115,22,0.1))',
                border: '1px solid var(--color-light-border)',
              }}
            >
              <MessageCircle className="w-9 h-9" style={{ color: 'var(--color-royal-blue)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">{t('messages.noMessagesYet')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted-text)' }}>
                {t('messages.startConversation')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {grouped.map((group) => (
              <div key={group.dayKey}>
                <DateSeparator label={group.dayLabel} />
                {group.messages.map((message, idx) => {
                  const isOwn = message.sender_id === user?.id;
                  const prevMsg = group.messages[idx - 1];
                  const nextMsg = group.messages[idx + 1];
                  const isFirst = !prevMsg || prevMsg.sender_id !== message.sender_id;
                  const isLast = !nextMsg || nextMsg.sender_id !== message.sender_id;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      isFirst={isFirst}
                      isLast={isLast}
                    />
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ══ COMPOSER ════════════════════════════════════════════ */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 px-4 py-3"
        style={{
          background: '#fff',
          borderTop: '1px solid var(--color-light-border)',
          boxShadow: '0 -1px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={handleInputChange}
              placeholder={t('messages.typeMessage')}
              disabled={sending}
              rows={1}
              className="w-full px-4 py-3 text-sm text-navy resize-none transition-all"
              style={{
                minHeight: 44,
                maxHeight: 128,
                borderRadius: 14,
                border: '1.5px solid var(--color-light-border)',
                background: 'var(--color-soft-gray)',
                outline: 'none',
                lineHeight: '1.5',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-royal-blue)';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-light-border)';
                e.currentTarget.style.background = 'var(--color-soft-gray)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              aria-label={t('messages.typeMessage')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            {/* char counter */}
            {messageInput.length > 0 && (
              <span
                className="absolute bottom-2 right-3 text-[10px] font-medium"
                style={{ color: charsNearLimit ? '#EF4444' : 'var(--color-muted-text)' }}
              >
                {charsLeft}
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!messageInput.trim() || sending}
            className="shrink-0 flex items-center justify-center transition-all"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background:
                messageInput.trim() && !sending
                  ? 'linear-gradient(135deg, var(--color-royal-blue), #1e40af)'
                  : 'var(--color-light-border)',
              color:
                messageInput.trim() && !sending
                  ? '#fff'
                  : 'var(--color-muted-text)',
              cursor: !messageInput.trim() || sending ? 'not-allowed' : 'pointer',
              boxShadow:
                messageInput.trim() && !sending
                  ? '0 4px 12px rgba(37,99,235,0.3)'
                  : 'none',
              transform: messageInput.trim() && !sending ? 'scale(1)' : 'scale(0.95)',
              transition: 'all 0.15s ease',
            }}
            aria-label={t('messages.send')}
          >
            {sending ? (
              <div
                className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: 'currentColor' }}
              />
            ) : (
              <Send className="w-4 h-4" style={{ transform: 'translateX(1px)' }} />
            )}
          </button>
        </div>

        <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--color-muted-text)' }}>
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </form>
    </div>
  );
}
