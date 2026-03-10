'use client';

import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/services/NotificationProvider';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const { t, locale } = useTranslation();

  const dateLocale = locale === 'fr' ? fr : enUS;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} {unreadCount === 1 ? 'notification non lue' : 'notifications non lues'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('notifications.empty')}
            </h2>
            <p className="text-gray-600">
              Vous recevrez des notifications ici lorsque des événements importants se produiront.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.is_read ? 'border-l-4 border-l-blue-600 bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification.id, notification.is_read)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      !notification.is_read ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <Bell className={`w-5 h-5 ${!notification.is_read ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                    )}
                  </div>

                  <p className="text-gray-700 mt-1">{notification.message}</p>

                  <p className="text-sm text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
