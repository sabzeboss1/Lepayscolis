import { ApiError } from '../api/client';

/**
 * Error response interface
 */
export interface ErrorResponse {
  type: 'network' | 'auth' | 'forbidden' | 'validation' | 'server' | 'not_found' | 'rate_limit' | 'unknown';
  message: string;
  fieldErrors?: Record<string, string>;
  retry?: boolean;
  redirect?: string;
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  endpoint?: string;
  method?: string;
  userId?: string;
}

/**
 * Error messages by status code and locale
 */
const ERROR_MESSAGES: Record<number, Record<string, string>> = {
  400: { fr: 'Requête invalide', en: 'Bad request' },
  401: { fr: 'Non authentifié', en: 'Unauthenticated' },
  403: { fr: 'Accès refusé', en: 'Access denied' },
  404: { fr: 'Ressource non trouvée', en: 'Resource not found' },
  422: { fr: 'Données invalides', en: 'Validation failed' },
  429: { fr: 'Trop de requêtes', en: 'Too many requests' },
  500: { fr: 'Erreur serveur', en: 'Server error' },
  502: { fr: 'Passerelle invalide', en: 'Bad gateway' },
  503: { fr: 'Service indisponible', en: 'Service unavailable' },
};

/**
 * Centralized error handler for API errors
 */
export class ErrorHandler {
  /**
   * Handle any error and return formatted error response
   */
  static handle(error: any, locale: string = 'fr', context?: ErrorContext): ErrorResponse {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error]', context, error);
    }

    // Network errors
    if (this.isNetworkError(error)) {
      return {
        type: 'network',
        message: locale === 'fr' 
          ? 'Problème de connexion. Vérifiez votre connexion internet.' 
          : 'Connection problem. Check your internet connection.',
        retry: true,
      };
    }

    // API errors
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          return this.handleAuthError(error, locale);
        case 403:
          return this.handleForbiddenError(error, locale);
        case 404:
          return this.handleNotFoundError(error, locale);
        case 422:
          return this.handleValidationError(error, locale);
        case 429:
          return this.handleRateLimitError(error, locale);
        case 500:
        case 502:
        case 503:
          return this.handleServerError(error, locale);
        default:
          return this.handleUnknownError(error, locale);
      }
    }

    return this.handleUnknownError(error, locale);
  }

  /**
   * Handle authentication errors (401)
   */
  private static handleAuthError(error: ApiError, locale: string): ErrorResponse {
    return {
      type: 'auth',
      message: locale === 'fr' 
        ? 'Votre session a expiré. Veuillez vous reconnecter.' 
        : 'Your session has expired. Please log in again.',
      redirect: '/auth/login',
    };
  }

  /**
   * Handle forbidden errors (403)
   */
  private static handleForbiddenError(error: ApiError, locale: string): ErrorResponse {
    return {
      type: 'forbidden',
      message: error.message || (locale === 'fr' 
        ? 'Accès refusé. Vous n\'avez pas les permissions requises.' 
        : 'Access denied. You don\'t have the required permissions.'),
    };
  }

  /**
   * Handle not found errors (404)
   */
  private static handleNotFoundError(error: ApiError, locale: string): ErrorResponse {
    return {
      type: 'not_found',
      message: error.message || (locale === 'fr' 
        ? 'La ressource demandée n\'existe pas.' 
        : 'The requested resource does not exist.'),
    };
  }

  /**
   * Handle validation errors (422)
   */
  private static handleValidationError(error: ApiError, locale: string): ErrorResponse {
    const fieldErrors = this.handleValidationErrors(error.errors || {});
    
    return {
      type: 'validation',
      message: error.message || (locale === 'fr' 
        ? 'Les données fournies sont invalides.' 
        : 'The provided data is invalid.'),
      fieldErrors,
    };
  }

  /**
   * Handle rate limit errors (429)
   */
  private static handleRateLimitError(error: ApiError, locale: string): ErrorResponse {
    return {
      type: 'rate_limit',
      message: locale === 'fr' 
        ? 'Trop de tentatives. Veuillez patienter quelques instants.' 
        : 'Too many attempts. Please wait a moment.',
    };
  }

  /**
   * Handle server errors (500, 502, 503)
   */
  private static handleServerError(error: ApiError, locale: string): ErrorResponse {
    return {
      type: 'server',
      message: locale === 'fr' 
        ? 'Une erreur est survenue. Veuillez réessayer plus tard.' 
        : 'An error occurred. Please try again later.',
      retry: true,
    };
  }

  /**
   * Handle unknown errors
   */
  private static handleUnknownError(error: any, locale: string): ErrorResponse {
    return {
      type: 'unknown',
      message: error.message || (locale === 'fr' 
        ? 'Une erreur inattendue est survenue.' 
        : 'An unexpected error occurred.'),
    };
  }

  /**
   * Convert validation errors to field-level errors
   */
  static handleValidationErrors(errors: Record<string, string[]>): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    
    Object.entries(errors).forEach(([field, messages]) => {
      fieldErrors[field] = messages[0]; // Take first error message
    });
    
    return fieldErrors;
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: any): boolean {
    return error instanceof TypeError || 
           error.message?.includes('fetch') ||
           error.message?.includes('network') ||
           error.name === 'NetworkError';
  }

  /**
   * Check if error is an authentication error
   */
  static isAuthError(error: any): boolean {
    return error instanceof ApiError && error.status === 401;
  }

  /**
   * Check if error should be retried
   */
  static shouldRetry(error: any): boolean {
    if (this.isNetworkError(error)) {
      return true;
    }
    
    if (error instanceof ApiError) {
      // Retry on server errors
      return error.status >= 500 && error.status < 600;
    }
    
    return false;
  }

  /**
   * Log error for monitoring/debugging
   */
  static log(error: any, context?: ErrorContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler]', {
        error,
        context,
        timestamp: new Date().toISOString(),
      });
    }
    
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // TODO: Integrate with error tracking service
      // Example: Sentry.captureException(error, { contexts: { custom: context } });
    }
  }

  /**
   * Get localized error message for status code
   */
  static getLocalizedMessage(status: number, locale: string = 'fr'): string {
    return ERROR_MESSAGES[status]?.[locale] || ERROR_MESSAGES[500][locale];
  }
}
