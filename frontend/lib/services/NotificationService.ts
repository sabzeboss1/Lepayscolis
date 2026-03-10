'use client';

import { Toast, ToastType } from '@/components/ui/Toast';

type NotificationListener = (toast: Toast) => void;

class NotificationServiceClass {
  private listeners: Set<NotificationListener> = new Set();
  private idCounter = 0;

  /**
   * Subscribe to notification events
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notify(toast: Toast): void {
    this.listeners.forEach((listener) => listener(toast));
  }

  /**
   * Generate unique ID for toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${this.idCounter++}`;
  }

  /**
   * Show a toast notification
   */
  show(options: Omit<Toast, 'id'>): string {
    const id = this.generateId();
    const toast: Toast = {
      id,
      duration: options.duration ?? 5000, // Default 5 seconds
      ...options,
    };

    this.notify(toast);
    return id;
  }

  /**
   * Show a success toast
   */
  success(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'success',
      title: title || 'Succès',
      message,
      duration,
    });
  }

  /**
   * Show an error toast
   */
  error(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'error',
      title: title || 'Erreur',
      message,
      duration: duration ?? 7000, // Errors stay longer
    });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'warning',
      title: title || 'Attention',
      message,
      duration,
    });
  }

  /**
   * Show an info toast
   */
  info(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'info',
      title: title || 'Information',
      message,
      duration,
    });
  }
}

// Export singleton instance
export const NotificationService = new NotificationServiceClass();
