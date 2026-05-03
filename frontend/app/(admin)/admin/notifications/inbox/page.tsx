'use client';

import { useNotifications } from '@/lib/services/NotificationProvider';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Bell, CheckCheck, ArrowLeft, UserPlus, ShieldCheck, CreditCard, Package, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  new_user: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
  kyc_submitted: { icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
  kyc_approved: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' },
  kyc_rejected: { icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-100' },
  payment: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  new_shipment: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

const DEFAULT_CONFIG = { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' };

export default function AdminInboxPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const dateLocale = locale === 'fr' ? fr : enUS;

  const handleClick = async (notificationId: string, isRead: boolean, data?: Record<string, any>, type?: string) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
    if (type === 'new_user' && data?.user_id) {
      router.push(`/admin/users/${data.user_id}`);
    } else if (type?.startsWith('kyc_')) {
      router.push('/admin/kyc');
    }
  };

  const getConfig = (type: string) => TYPE_CONFIG[type] || DEFAULT_CONFIG;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-0.5">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-14 h-14 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Aucune notification</h2>
          <p className="text-sm text-gray-500">Les notifications apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {notifications.map((notification) => {
            const cfg = getConfig(notification.type);
            const Icon = cfg.icon;
            return (
              <div
                key={notification.id}
                onClick={() => handleClick(notification.id, notification.is_read, notification.data, notification.type)}
                className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
