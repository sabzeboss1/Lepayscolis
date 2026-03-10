'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X,
  ChevronRight 
} from 'lucide-react';

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  dismissible?: boolean;
}

interface AlertBannerProps {
  alert: Alert;
  onDismiss?: (id: string) => void;
}

export default function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss(alert.id);
    }
  };

  if (isDismissed) {
    return null;
  }

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          message: 'text-blue-700',
          action: 'text-blue-600 hover:text-blue-700',
          dismiss: 'text-blue-500 hover:text-blue-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          action: 'text-yellow-600 hover:text-yellow-700',
          dismiss: 'text-yellow-500 hover:text-yellow-700'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          message: 'text-red-700',
          action: 'text-red-600 hover:text-red-700',
          dismiss: 'text-red-500 hover:text-red-700'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          message: 'text-green-700',
          action: 'text-green-600 hover:text-green-700',
          dismiss: 'text-green-500 hover:text-green-700'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          message: 'text-gray-700',
          action: 'text-gray-600 hover:text-gray-700',
          dismiss: 'text-gray-500 hover:text-gray-700'
        };
    }
  };

  const getAlertIcon = () => {
    const iconClass = `w-5 h-5 ${styles.icon}`;
    
    switch (alert.type) {
      case 'info':
        return <Info className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'success':
        return <CheckCircle className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const styles = getAlertStyles();

  return (
    <div
      className={`rounded-lg border ${styles.container} p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getAlertIcon()}
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {alert.title}
          </h3>
          <p className={`text-sm mt-1 ${styles.message}`}>
            {alert.message}
          </p>

          {/* Action link */}
          {alert.action && (
            <div className="mt-3">
              <Link
                href={alert.action.href}
                className={`inline-flex items-center space-x-1 text-sm font-medium ${styles.action} transition-colors`}
              >
                <span>{alert.action.label}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {alert.dismissible && (
          <button
            onClick={handleDismiss}
            className={`ml-3 flex-shrink-0 ${styles.dismiss} transition-colors`}
            aria-label="Dismiss alert"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Multiple alerts container
interface AlertBannersProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

export function AlertBanners({ alerts, onDismiss }: AlertBannersProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertBanner key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
