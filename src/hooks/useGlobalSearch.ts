/**
 * useGlobalSearch Hook
 *
 * React hook for the global search engine.
 * Provides debounced search with loading states, recent searches,
 * and modal state management.
 *
 * Usage:
 * ```typescript
 * const {
 *   query,
 *   setQuery,
 *   results,
 *   groups,
 *   isLoading,
 *   isOpen,
 *   open,
 *   close,
 *   toggle,
 *   recentSearches,
 *   clearRecentSearches,
 * } = useGlobalSearch();
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import {
  searchService,
  type SearchResult,
  type SearchResultGroup,
  type SearchOptions,
  type ParsedQuery,
  type RecentSearch,
  type SearchEntityType,
  parseSearchQuery,
} from '@/services/search';

// ============================================================================
// Types
// ============================================================================

export interface UseGlobalSearchOptions extends SearchOptions {
  /** Debounce delay in ms (default: 200) */
  debounceDelay?: number;
  /** Minimum query length to trigger search (default: 2) */
  minQueryLength?: number;
  /** Auto-save searches to recent (default: true) */
  saveToRecent?: boolean;
}

export interface UseGlobalSearchReturn {
  // Query state
  query: string;
  setQuery: (query: string) => void;
  parsedQuery: ParsedQuery | null;

  // Results
  results: SearchResult[];
  groups: SearchResultGroup[];
  totalCount: number;

  // Loading & error
  isLoading: boolean;
  error: string | null;

  // Modal state
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Recent searches
  recentSearches: RecentSearch[];
  clearRecentSearches: () => void;
  removeRecentSearch: (id: string) => void;

  // Index state
  isIndexReady: boolean;

  // Utilities
  clearSearch: () => void;
  executeQuickAction: (action: () => void | Promise<void>) => Promise<void>;
}

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<UseGlobalSearchOptions> = {
  debounceDelay: 200,
  minQueryLength: 2,
  saveToRecent: true,
  limit: 20,
  entityTypes: ['client', 'staff', 'service', 'appointment', 'ticket', 'transaction'],
  minScore: 0.4,
  boostRecent: true,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGlobalSearch(
  options: UseGlobalSearchOptions = {}
): UseGlobalSearchReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Query state
  const [query, setQueryInternal] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const debouncedQuery = useDebounce(query, opts.debounceDelay);

  // Results state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Index ready state
  const [isIndexReady, setIsIndexReady] = useState(false);

  // ============================================================================
  // Effects
  // ============================================================================

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
    setIsIndexReady(searchService.isIndexReady());
  }, []);

  // Check index ready state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const ready = searchService.isIndexReady();
      if (ready !== isIndexReady) {
        setIsIndexReady(ready);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isIndexReady]);

  // Parse query immediately (for UI feedback)
  useEffect(() => {
    if (query.trim()) {
      setParsedQuery(parseSearchQuery(query));
    } else {
      setParsedQuery(null);
    }
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      // Skip if query is too short
      if (debouncedQuery.length < opts.minQueryLength) {
        setResults([]);
        setGroups([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      // Skip if index not ready
      if (!searchService.isIndexReady()) {
        setError('Search index is building...');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await searchService.search(debouncedQuery, {
          limit: opts.limit,
          entityTypes: opts.entityTypes,
          minScore: opts.minScore,
          boostRecent: opts.boostRecent,
        });

        setResults(searchResults.results);
        setGroups(searchResults.groups);
        setTotalCount(searchResults.totalCount);
        setParsedQuery(searchResults.parsedQuery);

        // Save to recent searches if enabled and has results
        if (opts.saveToRecent && searchResults.totalCount > 0) {
          const primaryType = searchResults.groups[0]?.type;
          searchService.saveRecentSearch(
            debouncedQuery,
            searchResults.totalCount,
            primaryType
          );
          setRecentSearches(searchService.getRecentSearches());
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
        setGroups([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, opts.limit, opts.entityTypes, opts.minScore, opts.boostRecent, opts.saveToRecent, opts.minQueryLength]);

  // ============================================================================
  // Actions
  // ============================================================================

  const setQuery = useCallback((newQuery: string) => {
    setQueryInternal(newQuery);
    if (newQuery.length >= opts.minQueryLength) {
      setIsLoading(true);
    }
  }, [opts.minQueryLength]);

  const clearSearch = useCallback(() => {
    setQueryInternal('');
    setResults([]);
    setGroups([]);
    setTotalCount(0);
    setParsedQuery(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Optionally clear search when closing
    // clearSearch();
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearRecentSearchesFn = useCallback(() => {
    searchService.clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const removeRecentSearch = useCallback((id: string) => {
    searchService.removeRecentSearch(id);
    setRecentSearches(searchService.getRecentSearches());
  }, []);

  const executeQuickAction = useCallback(
    async (action: () => void | Promise<void>) => {
      try {
        await action();
        // Optionally close modal after action
        close();
      } catch (err) {
        console.error('Quick action error:', err);
      }
    },
    [close]
  );

  // ============================================================================
  // Return
  // ============================================================================

  return useMemo(
    () => ({
      // Query state
      query,
      setQuery,
      parsedQuery,

      // Results
      results,
      groups,
      totalCount,

      // Loading & error
      isLoading,
      error,

      // Modal state
      isOpen,
      open,
      close,
      toggle,

      // Recent searches
      recentSearches,
      clearRecentSearches: clearRecentSearchesFn,
      removeRecentSearch,

      // Index state
      isIndexReady,

      // Utilities
      clearSearch,
      executeQuickAction,
    }),
    [
      query,
      setQuery,
      parsedQuery,
      results,
      groups,
      totalCount,
      isLoading,
      error,
      isOpen,
      open,
      close,
      toggle,
      recentSearches,
      clearRecentSearchesFn,
      removeRecentSearch,
      isIndexReady,
      clearSearch,
      executeQuickAction,
    ]
  );
}

// ============================================================================
// Keyboard Shortcut Hook
// ============================================================================

/**
 * Hook to handle global keyboard shortcuts for search
 *
 * @param onOpen - Callback when search should open (Cmd+K / Ctrl+K)
 */
export function useSearchKeyboardShortcut(onOpen: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}

// ============================================================================
// Quick Action Event Handler Hook
// ============================================================================

/**
 * Hook to listen for global search quick action events
 *
 * @param handlers - Map of action handlers by action type
 */
export function useSearchActionHandler(
  handlers: Partial<
    Record<
      string,
      (entityType: SearchEntityType, entityId: string) => void | Promise<void>
    >
  >
): void {
  useEffect(() => {
    const handleAction = (event: CustomEvent) => {
      const { action, entityType, entityId } = event.detail;
      const handler = handlers[action];
      if (handler) {
        handler(entityType, entityId);
      }
    };

    window.addEventListener(
      'global-search-action',
      handleAction as EventListener
    );
    return () => {
      window.removeEventListener(
        'global-search-action',
        handleAction as EventListener
      );
    };
  }, [handlers]);
}

export default useGlobalSearch;
