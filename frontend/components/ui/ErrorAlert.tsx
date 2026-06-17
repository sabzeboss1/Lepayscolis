'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export interface ErrorAlertProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Severity level of the error
   */
  severity?: 'error' | 'warning' | 'info';
  
  /**
   * Optional field errors to display as a list
   */
  fieldErrors?: Record<string, string>;
  
  /**
   * Whether the alert can be dismissed
   */
  dismissible?: boolean;
  
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

const SEVERITY_STYLES = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    text: 'text-red-700',
    Icon: XCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    text: 'text-yellow-700',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    text: 'text-blue-700',
    Icon: AlertCircle,
  },
};

/**
 * ErrorAlert component for displaying user-friendly error messages
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  severity = 'error',
  fieldErrors,
  dismissible = true,
  onDismiss,
  className = '',
}) => {
  const styles = SEVERITY_STYLES[severity];
  const { Icon } = styles;
  const hasFieldErrors = fieldErrors && Object.keys(fieldErrors).length > 0;

  return (
    <div
      role="alert"
      className={`border rounded-xl p-4 ${styles.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Main message */}
          <p className={`text-sm font-semibold ${styles.title}`}>
            {message}
          </p>

          {/* Field errors list */}
          {hasFieldErrors && (
            <ul className={`mt-2 space-y-1 text-sm ${styles.text}`}>
              {Object.entries(fieldErrors).map(([field, error]) => (
                <li key={field} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`flex-shrink-0 ${styles.icon} hover:opacity-70 transition-opacity`}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
