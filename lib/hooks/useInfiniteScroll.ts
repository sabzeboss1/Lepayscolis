/**
 * Infinite scroll hook with prefetch support
 * Automatically loads more data when user scrolls near the bottom
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  initialPage?: number;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  prefetchPages?: number; // Number of pages to prefetch ahead
  enabled?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  observerRef: (node: HTMLElement | null) => void;
}

/**
 * Hook for infinite scroll with automatic loading
 * 
 * @param fetcher - Function that fetches paginated data
 * @param options - Configuration options
 * 
 * @example
 * const { data, isLoading, hasMore, observerRef } = useInfiniteScroll(
 *   (page) => apiClient.get(`/api/trips?page=${page}`),
 *   { threshold: 200, prefetchPages: 1 }
 * );
 * 
 * return (
 *   <div>
 *     {data.map(item => <Item key={item.id} {...item} />)}
 *     {hasMore && <div ref={observerRef}>Loading...</div>}
 *   </div>
 * );
 */
export function useInfiniteScroll<T>(
  fetcher: (page: number) => Promise<PaginatedResponse<T>>,
  options?: UseInfiniteScrollOptions<T>
): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(options?.initialPage || 1);
  const [lastPage, setLastPage] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  const enabled = options?.enabled !== false;
  const threshold = options?.threshold || 200;
  const prefetchPages = options?.prefetchPages || 1;

  /**
   * Fetch a specific page
   */
  const fetchPage = useCallback(async (page: number, append = true) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }
      
      setError(null);

      const response = await fetcher(page);

      if (append) {
        setData(prev => [...prev, ...response.data]);
      } else {
        setData(response.data);
      }

      setCurrentPage(response.meta.current_page);
      setLastPage(response.meta.last_page);
      setHasMore(response.meta.current_page < response.meta.last_page);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      loadingRef.current = false;
    }
  }, [fetcher]);

  /**
   * Load more data (next page)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    await fetchPage(currentPage + 1, true);
  }, [hasMore, currentPage, fetchPage]);

  /**
   * Refresh data (reload from page 1)
   */
  const refresh = useCallback(async () => {
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    await fetchPage(1, false);
  }, [fetchPage]);

  /**
   * Prefetch next pages
   */
  const prefetch = useCallback(async () => {
    if (!hasMore || !lastPage) return;

    const pagesToPrefetch = Math.min(
      prefetchPages,
      lastPage - currentPage
    );

    for (let i = 1; i <= pagesToPrefetch; i++) {
      const nextPage = currentPage + i;
      if (nextPage <= lastPage) {
        // Prefetch in background without updating state
        fetcher(nextPage).catch(() => {
          // Silently fail prefetch
        });
      }
    }
  }, [hasMore, lastPage, currentPage, prefetchPages, fetcher]);

  /**
   * Intersection observer callback
   */
  const observerCallback = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node || !enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observerRef.current.observe(node);
  }, [enabled, hasMore, threshold, loadMore]);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0) {
      fetchPage(1, false);
    }
  }, [enabled]); // Only run on mount

  // Prefetch when current page changes
  useEffect(() => {
    if (enabled && currentPage > 0) {
      prefetch();
    }
  }, [enabled, currentPage, prefetch]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isFetchingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    observerRef: observerCallback,
  };
}
