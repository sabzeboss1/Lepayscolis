/**
 * Security event logging service with monitoring integration
 */

/**
 * Security event types
 */
export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  CSRF_VIOLATION = 'csrf_violation',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  FILE_UPLOAD_VIOLATION = 'file_upload_violation',
  SESSION_HIJACK_ATTEMPT = 'session_hijack_attempt',
}

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
}

/**
 * Sensitive data patterns to filter from logs
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /credit[_-]?card/i,
  /ssn/i,
  /social[_-]?security/i,
];

/**
 * Sensitive data keys to filter
 */
const SENSITIVE_KEYS = [
  'password',
  'password_confirmation',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
  'social_security_number',
];

/**
 * Security Logger class
 */
class SecurityLogger {
  private static instance: SecurityLogger;
  private events: SecurityEvent[] = [];
  private maxEvents: number = 100;
  private sentryInitialized: boolean = false;

  private constructor() {
    this.initializeSentry();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Initialize Sentry for production monitoring
   */
  private initializeSentry(): void {
    if (typeof window === 'undefined') return;

    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    const environment = process.env.NODE_ENV;

    if (sentryDsn && environment === 'production') {
      // Dynamically import Sentry
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: sentryDsn,
          environment,
          tracesSampleRate: 0.1,
          beforeSend: (event, hint) => {
            // Filter sensitive data from Sentry events
            if (event.request) {
              event.request = this.filterSensitiveData(event.request);
            }
            if (event.extra) {
              event.extra = this.filterSensitiveData(event.extra);
            }
            return event;
          },
        });
        this.sentryInitialized = true;
      });
    }
  }

  /**
   * Filter sensitive data from objects
   */
  private filterSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const filtered: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if key is sensitive
      const isSensitiveKey = SENSITIVE_KEYS.some((pattern) =>
        key.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isSensitiveKey) {
        filtered[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        // Check if value matches sensitive patterns
        const isSensitiveValue = SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
        filtered[key] = isSensitiveValue ? '[REDACTED]' : value;
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = this.filterSensitiveData(value);
      } else {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  /**
   * Get client IP address (best effort)
   */
  private getClientIp(): string | undefined {
    // In browser, we can't reliably get IP
    // This would typically be done server-side
    return undefined;
  }

  /**
   * Get user agent
   */
  private getUserAgent(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.navigator.userAgent;
  }

  /**
   * Get current URL
   */
  private getCurrentUrl(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.location.href;
  }

  /**
   * Get current user ID from auth context
   */
  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    // This would typically come from auth context
    // For now, return undefined
    return undefined;
  }

  /**
   * Log a security event
   */
  public logEvent(
    type: SecurityEventType,
    severity: SecurityEventSeverity,
    message: string,
    context?: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      message,
      context: context ? this.filterSensitiveData(context) : undefined,
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      ipAddress: this.getClientIp(),
      userAgent: this.getUserAgent(),
      url: this.getCurrentUrl(),
    };

    // Add to local event store
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security Event]', {
        type,
        severity,
        message,
        context: event.context,
      });
    }

    // Send to Sentry in production
    if (this.sentryInitialized && process.env.NODE_ENV === 'production') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureMessage(message, {
          level: this.mapSeverityToSentryLevel(severity),
          tags: {
            security_event: type,
            severity,
          },
          extra: event.context,
        });
      });
    }

    // Send to backend for persistent storage
    this.sendToBackend(event);
  }

  /**
   * Map severity to Sentry level
   */
  private mapSeverityToSentryLevel(severity: SecurityEventSeverity): any {
    switch (severity) {
      case SecurityEventSeverity.LOW:
        return 'info';
      case SecurityEventSeverity.MEDIUM:
        return 'warning';
      case SecurityEventSeverity.HIGH:
        return 'error';
      case SecurityEventSeverity.CRITICAL:
        return 'fatal';
      default:
        return 'warning';
    }
  }

  /**
   * Send event to backend for persistent storage
   */
  private async sendToBackend(event: SecurityEvent): Promise<void> {
    try {
      // Only send in production to avoid noise
      if (process.env.NODE_ENV !== 'production') return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/security-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        credentials: 'include',
      });
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.error('Failed to send security event to backend:', error);
    }
  }

  /**
   * Log failed login attempt
   */
  public logFailedLogin(email: string, reason?: string): void {
    this.logEvent(
      SecurityEventType.FAILED_LOGIN,
      SecurityEventSeverity.MEDIUM,
      'Failed login attempt',
      { email, reason }
    );
  }

  /**
   * Log unauthorized access attempt
   */
  public logUnauthorizedAccess(resource: string, action?: string): void {
    this.logEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventSeverity.HIGH,
      'Unauthorized access attempt',
      { resource, action }
    );
  }

  /**
   * Log rate limit exceeded
   */
  public logRateLimitExceeded(endpoint: string, limit: number): void {
    this.logEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventSeverity.MEDIUM,
      'Rate limit exceeded',
      { endpoint, limit }
    );
  }

  /**
   * Log invalid token
   */
  public logInvalidToken(tokenType: string): void {
    this.logEvent(
      SecurityEventType.INVALID_TOKEN,
      SecurityEventSeverity.HIGH,
      'Invalid token detected',
      { tokenType }
    );
  }

  /**
   * Log suspicious activity
   */
  public logSuspiciousActivity(description: string, context?: Record<string, any>): void {
    this.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityEventSeverity.HIGH,
      description,
      context
    );
  }

  /**
   * Get recent security events
   */
  public getRecentEvents(limit: number = 10): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear event history
   */
  public clearEvents(): void {
    this.events = [];
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();

// Export convenience functions
export const logFailedLogin = (email: string, reason?: string) =>
  securityLogger.logFailedLogin(email, reason);

export const logUnauthorizedAccess = (resource: string, action?: string) =>
  securityLogger.logUnauthorizedAccess(resource, action);

export const logRateLimitExceeded = (endpoint: string, limit: number) =>
  securityLogger.logRateLimitExceeded(endpoint, limit);

export const logInvalidToken = (tokenType: string) => securityLogger.logInvalidToken(tokenType);

export const logSuspiciousActivity = (description: string, context?: Record<string, any>) =>
  securityLogger.logSuspiciousActivity(description, context);
