'use client';

import { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Plane, 
  Package, 
  CreditCard, 
  FileCheck,
  Clock,
  RefreshCw
} from 'lucide-react';

export interface Activity {
  id: string;
  type: 'user_registered' | 'trip_created' | 'shipment_booked' | 'payment_received' | 'kyc_submitted';
  description: string;
  user?: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  onRefresh?: () => void;
}

export default function ActivityFeed({
  activities,
  loading = false,
  autoRefresh = false,
  refreshInterval = 60,
  onRefresh
}: ActivityFeedProps) {
  const [timeLeft, setTimeLeft] = useState(refreshInterval);

  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'trip_created':
        return <Plane className="w-5 h-5 text-purple-600" />;
      case 'shipment_booked':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'payment_received':
        return <CreditCard className="w-5 h-5 text-yellow-600" />;
      case 'kyc_submitted':
        return <FileCheck className="w-5 h-5 text-indigo-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityBgColor = (type: Activity['type']) => {
    switch (type) {
      case 'user_registered':
        return 'bg-blue-100';
      case 'trip_created':
        return 'bg-purple-100';
      case 'shipment_booked':
        return 'bg-green-100';
      case 'payment_received':
        return 'bg-yellow-100';
      case 'kyc_submitted':
        return 'bg-indigo-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-xs text-gray-500 mt-0.5">Live platform updates</p>
          </div>
          {autoRefresh && onRefresh && (
            <button
              onClick={() => {
                onRefresh();
                setTimeLeft(refreshInterval);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
              title={`Auto-refresh in ${timeLeft}s`}
            >
              <RefreshCw className={`w-4 h-4 ${timeLeft <= 5 ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">{timeLeft}s</span>
            </button>
          )}
        </div>
      </div>

      {/* Activity list */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-medium">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Activity will appear here as it happens</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                {/* Icon with pulse animation for recent items */}
                <div className={`relative w-10 h-10 rounded-full ${getActivityBgColor(activity.type)} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {getActivityIcon(activity.type)}
                  {index === 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {activity.user && (
                      <span className="font-semibold text-gray-900">{activity.user.name}</span>
                    )}{' '}
                    <span className="text-gray-700">{activity.description}</span>
                  </p>
                  <div className="flex items-center mt-1.5 space-x-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500 font-medium">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>

                {/* User avatar (if available) */}
                {activity.user?.avatar && (
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
}
