/**
 * Hook for API calls with caching support
 * Provides automatic caching, revalidation, and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheManager, CacheConfig } from '../cache/CacheManager';

interface UseCachedApiOptions<T> extends CacheConfig {
  enabled?: boolean; // Whether to fetch immediately
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface UseCachedApiReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  revalidate: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Hook for fetching data with caching
 * 
 * @param key - Unique cache key for this request
 * @param fetcher - Function that fetches the data
 * @param options - Cache configuration and callbacks
 * 
 * @example
 * const { data, isLoading, error, revalidate } = useCachedApi(
 *   'trips-list',
 *   () => apiClient.get('/api/trips'),
 *   { ttl: 300, enabled: true }
 * );
 */
export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseCachedApiOptions<T>
): UseCachedApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled !== false;

  /**
   * Fetch data with caching
   */
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = cacheManager.get<T>(key);
        if (cachedData !== null) {
          setData(cachedData);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Update cache
      cacheManager.set(key, freshData, {
        ttl: options?.ttl ?? 300,
        staleWhileRevalidate: options?.staleWhileRevalidate,
      });

      setData(freshData);
      
      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess(freshData);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred';
      setError(errorMessage);
      
      // Call error callback
      if (options?.onError) {
        options.onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /**
   * Revalidate (force refresh) the data
   */
  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Invalidate the cache entry
   */
  const invalidate = useCallback(() => {
    cacheManager.invalidate(key);
    setData(null);
  }, [key]);

  // Fetch on mount if enabled
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  return {
    data,
    isLoading,
    error,
    revalidate,
    invalidate,
  };
}

/**
 * Hook for mutating data with cache invalidation
 * 
 * @example
 * const { mutate, isLoading } = useCachedMutation(
 *   async (data) => apiClient.post('/api/trips', data),
 *   {
 *     onSuccess: () => {
 *       cacheManager.invalidatePattern(/^trips-/);
 *     }
 *   }
 * );
 */
export function useCachedMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: any, variables: TVariables) => void;
    invalidateKeys?: string[];
    invalidatePatterns?: RegExp[];
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mutationFn(variables);

      // Invalidate cache keys
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(key => cacheManager.invalidate(key));
      }

      // Invalidate cache patterns
      if (options?.invalidatePatterns) {
        options.invalidatePatterns.forEach(pattern => 
          cacheManager.invalidatePattern(pattern)
        );
      }

      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }

      return data;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred';
      setError(errorMessage);

      // Call error callback
      if (options?.onError) {
        options.onError(err, variables);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    isLoading,
    error,
  };
}
