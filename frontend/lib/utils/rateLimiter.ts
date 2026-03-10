/**
 * Client-side rate limiting utility
 */

import { logRateLimitExceeded } from '../services/SecurityLogger';

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
  retryAfterMs?: number; // Time to wait before retrying after limit exceeded
}

/**
 * Request record for tracking
 */
interface RequestRecord {
  timestamp: number;
  count: number;
}

/**
 * Rate Limiter class
 */
class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = {
      retryAfterMs: 60000, // Default 1 minute
      ...config,
    };
  }

  /**
   * Check if request is allowed
   * @param key - Unique key for the request (e.g., endpoint, user ID)
   * @returns Object with allowed status and retry after time
   */
  public checkLimit(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let keyRequests = this.requests.get(key) || [];

    // Remove requests outside the time window
    keyRequests = keyRequests.filter((record) => record.timestamp > windowStart);

    // Count total requests in window
    const totalRequests = keyRequests.reduce((sum, record) => sum + record.count, 0);

    // Check if limit exceeded
    if (totalRequests >= this.config.maxRequests) {
      const oldestRequest = keyRequests[0];
      const retryAfter = oldestRequest
        ? oldestRequest.timestamp + this.config.windowMs - now
        : this.config.retryAfterMs!;

      // Log rate limit exceeded
      logRateLimitExceeded(key, this.config.maxRequests);

      return {
        allowed: false,
        retryAfter: Math.max(retryAfter, 0),
      };
    }

    // Add new request
    keyRequests.push({
      timestamp: now,
      count: 1,
    });

    // Update requests map
    this.requests.set(key, keyRequests);

    return { allowed: true };
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Key to reset
   */
  public reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit records
   */
  public clearAll(): void {
    this.requests.clear();
  }

  /**
   * Get remaining requests for a key
   * @param key - Key to check
   */
  public getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const keyRequests = this.requests.get(key) || [];
    const validRequests = keyRequests.filter((record) => record.timestamp > windowStart);
    const totalRequests = validRequests.reduce((sum, record) => sum + record.count, 0);

    return Math.max(this.config.maxRequests - totalRequests, 0);
  }
}

/**
 * Global rate limiters for different use cases
 */

// API requests: 100 requests per minute
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  retryAfterMs: 60000,
});

// Login attempts: 5 attempts per 15 minutes
export const loginRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60000, // 15 minutes
  retryAfterMs: 15 * 60000,
});

// Search requests: 30 requests per minute
export const searchRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60000,
  retryAfterMs: 60000,
});

// File uploads: 10 uploads per 5 minutes
export const uploadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 5 * 60000,
  retryAfterMs: 5 * 60000,
});

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Wrapper function to apply rate limiting to async functions
 * @param fn - Function to rate limit
 * @param limiter - Rate limiter to use
 * @param key - Key for rate limiting (defaults to function name)
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter,
  key?: string
): T {
  return (async (...args: any[]) => {
    const limitKey = key || fn.name || 'default';
    const { allowed, retryAfter } = limiter.checkLimit(limitKey);

    if (!allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter! / 1000)} seconds.`,
        retryAfter!
      );
    }

    return fn(...args);
  }) as T;
}

/**
 * Handle 429 Too Many Requests response from API
 * @param retryAfterHeader - Retry-After header value from response
 * @param callback - Function to call after waiting
 */
export async function handleApiRateLimit(
  retryAfterHeader: string | null,
  callback: () => Promise<any>
): Promise<any> {
  if (!retryAfterHeader) {
    // Default wait time if no header provided
    await new Promise((resolve) => setTimeout(resolve, 60000));
    return callback();
  }

  // Parse Retry-After header (can be seconds or HTTP date)
  let retryAfterMs: number;

  if (/^\d+$/.test(retryAfterHeader)) {
    // Seconds
    retryAfterMs = parseInt(retryAfterHeader, 10) * 1000;
  } else {
    // HTTP date
    const retryDate = new Date(retryAfterHeader);
    retryAfterMs = retryDate.getTime() - Date.now();
  }

  // Wait for the specified time
  await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfterMs, 0)));

  // Retry the request
  return callback();
}

/**
 * Decorator for rate limiting class methods
 */
export function RateLimit(limiter: RateLimiter, key?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const limitKey = key || `${target.constructor.name}.${propertyKey}`;
      const { allowed, retryAfter } = limiter.checkLimit(limitKey);

      if (!allowed) {
        throw new RateLimitError(
          `Rate limit exceeded for ${propertyKey}. Please try again in ${Math.ceil(retryAfter! / 1000)} seconds.`,
          retryAfter!
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
