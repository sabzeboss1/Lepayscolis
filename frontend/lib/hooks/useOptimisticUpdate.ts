/**
 * Optimistic update hook with automatic rollback on error
 * Provides immediate UI feedback while waiting for server confirmation
 */

import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
  onRollback?: (previousData: TData, variables: TVariables) => void;
}

interface UseOptimisticUpdateReturn<TData, TVariables> {
  data: TData;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  update: (variables: TVariables) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for optimistic updates with rollback
 * 
 * @param initialData - Initial data state
 * @param optimisticUpdater - Function to apply optimistic update to data
 * @param mutationFn - Function that performs the actual mutation
 * @param options - Callbacks for success, error, and rollback
 * 
 * @example
 * const { data, isLoading, isSyncing, update } = useOptimisticUpdate(
 *   trip,
 *   (trip, { liked }) => ({ ...trip, is_liked: liked, likes_count: trip.likes_count + (liked ? 1 : -1) }),
 *   ({ liked }) => apiClient.post(`/api/trips/${trip.id}/like`, { liked }),
 *   {
 *     onSuccess: () => toast.success('Updated!'),
 *     onError: () => toast.error('Failed to update'),
 *   }
 * );
 */
export function useOptimisticUpdate<TData, TVariables>(
  initialData: TData,
  optimisticUpdater: (data: TData, variables: TVariables) => TData,
  mutationFn: (variables: TVariables) => Promise<any>,
  options?: OptimisticUpdateOptions<TData, TVariables>
): UseOptimisticUpdateReturn<TData, TVariables> {
  const [data, setData] = useState<TData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Perform optimistic update
   */
  const update = useCallback(async (variables: TVariables) => {
    // Save current state for potential rollback
    const previousData = data;

    try {
      setIsLoading(true);
      setIsSyncing(true);
      setError(null);

      // Apply optimistic update immediately
      const optimisticData = optimisticUpdater(data, variables);
      setData(optimisticData);

      // Perform actual mutation
      const result = await mutationFn(variables);

      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess(result, variables);
      }
    } catch (err: any) {
      // Rollback on error
      setData(previousData);

      const errorMessage = err?.message || 'Update failed';
      setError(errorMessage);

      // Call error callback
      if (options?.onError) {
        options.onError(err, variables);
      }

      // Call rollback callback
      if (options?.onRollback) {
        options.onRollback(previousData, variables);
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [data, optimisticUpdater, mutationFn, options]);

  /**
   * Reset to initial data
   */
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
    setIsSyncing(false);
  }, [initialData]);

  return {
    data,
    isLoading,
    isSyncing,
    error,
    update,
    reset,
  };
}

/**
 * Hook for optimistic list updates (add, remove, update items)
 * 
 * @example
 * const { items, addItem, removeItem, updateItem } = useOptimisticList(
 *   initialTrips,
 *   (trip) => apiClient.post('/api/trips', trip),
 *   (id) => apiClient.delete(`/api/trips/${id}`),
 *   (id, data) => apiClient.put(`/api/trips/${id}`, data)
 * );
 */
export function useOptimisticList<TItem extends { id: string | number }>(
  initialItems: TItem[],
  addFn?: (item: Omit<TItem, 'id'>) => Promise<TItem>,
  removeFn?: (id: string | number) => Promise<void>,
  updateFn?: (id: string | number, data: Partial<TItem>) => Promise<TItem>
) {
  const [items, setItems] = useState<TItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add item optimistically
   */
  const addItem = useCallback(async (item: Omit<TItem, 'id'>) => {
    if (!addFn) return;

    // Create temporary item with temp ID
    const tempItem = { ...item, id: `temp-${Date.now()}` } as TItem;
    const previousItems = items;

    try {
      setIsLoading(true);
      setError(null);

      // Add optimistically
      setItems(prev => [...prev, tempItem]);

      // Perform actual add
      const newItem = await addFn(item);

      // Replace temp item with real item
      setItems(prev => prev.map(i => i.id === tempItem.id ? newItem : i));
    } catch (err: any) {
      // Rollback on error
      setItems(previousItems);
      setError(err?.message || 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  }, [items, addFn]);

  /**
   * Remove item optimistically
   */
  const removeItem = useCallback(async (id: string | number) => {
    if (!removeFn) return;

    const previousItems = items;

    try {
      setIsLoading(true);
      setError(null);

      // Remove optimistically
      setItems(prev => prev.filter(item => item.id !== id));

      // Perform actual remove
      await removeFn(id);
    } catch (err: any) {
      // Rollback on error
      setItems(previousItems);
      setError(err?.message || 'Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  }, [items, removeFn]);

  /**
   * Update item optimistically
   */
  const updateItem = useCallback(async (id: string | number, data: Partial<TItem>) => {
    if (!updateFn) return;

    const previousItems = items;

    try {
      setIsLoading(true);
      setError(null);

      // Update optimistically
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      ));

      // Perform actual update
      const updatedItem = await updateFn(id, data);

      // Replace with server response
      setItems(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
    } catch (err: any) {
      // Rollback on error
      setItems(previousItems);
      setError(err?.message || 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  }, [items, updateFn]);

  return {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    updateItem,
    setItems,
  };
}
