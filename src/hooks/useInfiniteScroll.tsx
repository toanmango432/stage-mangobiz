/**
 * Infinite Scroll Hook
 *
 * Provides easy infinite scroll functionality with cursor-based pagination.
 * Works with any paginated data source.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions<T> {
  /** Function to fetch a page of data */
  fetchPage: (cursor?: string) => Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }>;
  /** Initial data (optional) */
  initialData?: T[];
  /** Enable/disable the hook */
  enabled?: boolean;
}

interface UseInfiniteScrollResult<T> {
  /** All loaded items */
  items: T[];
  /** Whether currently loading */
  isLoading: boolean;
  /** Whether loading more items */
  isLoadingMore: boolean;
  /** Error if any */
  error: Error | null;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Load the next page */
  loadMore: () => Promise<void>;
  /** Refresh from the beginning */
  refresh: () => Promise<void>;
  /** Ref to attach to scroll sentinel element */
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchPage,
  initialData = [],
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (!enabled) return;

    const loadInitial = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchPage();
        setItems(result.data);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
  }, [enabled, fetchPage]);

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || !cursor) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await fetchPage(cursor);
      setItems(prev => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more data'));
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [fetchPage, cursor, hasMore]);

  // Refresh from beginning
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCursor(null);
    setHasMore(true);

    try {
      const result = await fetchPage();
      setItems(result.data);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh data'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  // Intersection observer for auto-loading
  const setSentinelRef = useCallback((node: HTMLElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node || !enabled) return;

    sentinelRef.current = node;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load before reaching the end
        threshold: 0,
      }
    );

    observerRef.current.observe(node);
  }, [enabled, hasMore, loadMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    sentinelRef: setSentinelRef,
  };
}

/**
 * Sentinel component for infinite scroll
 * Place at the end of your list to trigger loading
 */
export function InfiniteScrollSentinel({
  sentinelRef,
  isLoadingMore,
  hasMore,
}: {
  sentinelRef: (node: HTMLElement | null) => void;
  isLoadingMore: boolean;
  hasMore: boolean;
}) {
  if (!hasMore) return null;

  return (
    <div
      ref={sentinelRef}
      className="flex items-center justify-center py-4"
    >
      {isLoadingMore && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading more...</span>
        </div>
      )}
    </div>
  );
}

export default useInfiniteScroll;
