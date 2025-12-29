/**
 * Global Search Service
 *
 * Main orchestrator for the universal search engine.
 * Routes queries to appropriate search methods based on:
 * - Prefix detection (#, @, $, date:, staff:, status:, service:)
 * - Phone number patterns
 * - General text search
 *
 * Returns ranked, deduplicated results across all entity types.
 */

import type {
  SearchResult,
  SearchOptions,
  SearchResultGroup,
  SearchEntityType,
  RecentSearch,
  ParsedQuery,
  IndexedEntity,
} from './types';
import { ENTITY_CONFIG, DEFAULT_SEARCH_OPTIONS, PREFIX_CONFIG } from './types';
import { parseSearchQuery, isValidSearchQuery } from './queryParser';
import { searchIndex } from './searchIndex';
import { toSearchResult, groupResultsByType } from './searchers';

// ============================================================================
// Constants
// ============================================================================

const RECENT_SEARCHES_KEY = 'mango_recent_searches';
const MAX_RECENT_SEARCHES = 10;

// ============================================================================
// Recent Searches Storage
// ============================================================================

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): RecentSearch[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as RecentSearch[];
  } catch {
    return [];
  }
}

/**
 * Save a search to recent searches
 */
export function saveRecentSearch(
  query: string,
  resultCount: number,
  primaryResultType?: SearchEntityType
): void {
  try {
    const recent = getRecentSearches();

    // Remove duplicate if exists
    const filtered = recent.filter(
      (r) => r.query.toLowerCase() !== query.toLowerCase()
    );

    // Add new search at beginning
    const newSearch: RecentSearch = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query,
      timestamp: Date.now(),
      resultCount,
      primaryResultType,
    };

    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Remove a specific recent search
 */
export function removeRecentSearch(id: string): void {
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((r) => r.id !== id);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Main Search Function
// ============================================================================

/**
 * Perform a global search across all entity types
 *
 * @param query - Search query (may include prefixes)
 * @param options - Search options
 * @returns Array of search results grouped by entity type
 */
export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<{
  results: SearchResult[];
  groups: SearchResultGroup[];
  totalCount: number;
  parsedQuery: ParsedQuery;
}> {
  const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };

  // Parse the query
  const parsedQuery = parseSearchQuery(query);

  // Validate query
  if (!isValidSearchQuery(query)) {
    return {
      results: [],
      groups: [],
      totalCount: 0,
      parsedQuery,
    };
  }

  // Determine which entity types to search based on prefix
  let targetEntityTypes = opts.entityTypes;
  if (parsedQuery.prefix && PREFIX_CONFIG[parsedQuery.prefix]) {
    targetEntityTypes = PREFIX_CONFIG[parsedQuery.prefix].targetEntities;
  }

  // Perform search based on query type
  let searchResults: Array<{
    entity: IndexedEntity;
    score: number;
    matchedField: string;
  }> = [];

  // Route to appropriate search method
  if (parsedQuery.prefix === '#') {
    // Ticket number search
    const ticketNumber = parsedQuery.normalizedQuery;
    if (ticketNumber) {
      searchResults = searchIndex.searchByTicketNumber(ticketNumber);
    }
  } else if (parsedQuery.prefix === '$' && parsedQuery.amountFilter) {
    // Amount search
    searchResults = searchIndex.searchByAmount(
      parsedQuery.amountFilter.min,
      parsedQuery.amountFilter.max,
      targetEntityTypes
    );
  } else if (parsedQuery.isPhoneSearch && parsedQuery.phoneDigits) {
    // Phone number search
    searchResults = searchIndex.searchByPhone(parsedQuery.phoneDigits);
  } else if (parsedQuery.prefix === 'date:' && parsedQuery.dateFilter) {
    // Date filter search - combine with text search if query has content
    if (parsedQuery.normalizedQuery) {
      searchResults = searchIndex.searchByText(
        parsedQuery.normalizedQuery,
        targetEntityTypes
      );
    }
    // Filter by date range
    searchResults = searchResults.filter((r) => {
      const timestamp = r.entity.timestamp;
      if (!timestamp || !parsedQuery.dateFilter?.start || !parsedQuery.dateFilter?.end) {
        return true;
      }
      return (
        timestamp >= parsedQuery.dateFilter.start.getTime() &&
        timestamp < parsedQuery.dateFilter.end.getTime()
      );
    });
  } else if (parsedQuery.prefix === 'status:' && parsedQuery.statusFilter) {
    // Status filter - search and filter
    searchResults = searchIndex
      .searchByText('', targetEntityTypes)
      .filter((r) => {
        const status = r.entity.displayData.status as string | undefined;
        return status?.toLowerCase().includes(parsedQuery.statusFilter!.toLowerCase());
      });
  } else {
    // General text search
    searchResults = searchIndex.searchByText(
      parsedQuery.normalizedQuery,
      targetEntityTypes
    );
  }

  // Apply minimum score filter
  searchResults = searchResults.filter((r) => r.score >= opts.minScore);

  // Apply recency boost if enabled
  if (opts.boostRecent) {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;

    searchResults = searchResults.map((r) => {
      const timestamp = r.entity.timestamp;
      if (!timestamp) return r;

      const age = now - timestamp;
      let recencyBoost = 0;

      if (age < hourMs) {
        recencyBoost = 0.1; // Last hour
      } else if (age < dayMs) {
        recencyBoost = 0.05; // Today
      } else if (age < 7 * dayMs) {
        recencyBoost = 0.02; // This week
      }

      return {
        ...r,
        score: Math.min(1, r.score + recencyBoost),
      };
    });
  }

  // Sort by score (descending)
  searchResults.sort((a, b) => b.score - a.score);

  // Apply limit
  searchResults = searchResults.slice(0, opts.limit);

  // Transform to SearchResult format
  const results: SearchResult[] = searchResults.map((r) =>
    toSearchResult(
      {
        key: `${r.entity.type}:${r.entity.id}`,
        id: r.entity.id,
        type: r.entity.type,
        searchableText: [],
        phoneNumbers: [],
        displayData: r.entity.displayData,
        timestamp: r.entity.timestamp || Date.now(),
      },
      r.score,
      r.matchedField
    )
  );

  // Group results by type
  const groupedMap = groupResultsByType(results);

  // Convert to SearchResultGroup array
  const groups: SearchResultGroup[] = [];
  for (const [type, typeResults] of groupedMap) {
    const config = ENTITY_CONFIG[type];
    groups.push({
      type,
      label: config.label,
      icon: config.icon,
      color: config.color,
      bgColor: config.bgColor,
      results: typeResults,
    });
  }

  // Sort groups by first result score
  groups.sort((a, b) => {
    const aScore = a.results[0]?.score || 0;
    const bScore = b.results[0]?.score || 0;
    return bScore - aScore;
  });

  return {
    results,
    groups,
    totalCount: results.length,
    parsedQuery,
  };
}

// ============================================================================
// Index Management
// ============================================================================

/**
 * Initialize the search index for a store
 *
 * @param storeId - Store ID to build index for
 */
export async function initializeSearchIndex(storeId: string): Promise<void> {
  await searchIndex.buildIndex(storeId);
}

/**
 * Check if search index is ready
 */
export function isIndexReady(): boolean {
  return searchIndex.isReady();
}

/**
 * Get index statistics
 */
export function getIndexStats(): { totalEntities: number; byType: Record<string, number> } {
  return searchIndex.getStats();
}

/**
 * Rebuild the search index
 *
 * @param storeId - Store ID to rebuild index for
 */
export async function rebuildIndex(storeId: string): Promise<void> {
  searchIndex.clear();
  await searchIndex.buildIndex(storeId);
}

// ============================================================================
// Incremental Updates
// ============================================================================

/**
 * Add or update an entity in the search index
 */
export function updateEntity(
  type: SearchEntityType,
  entity: Record<string, unknown>
): void {
  // Use the public updateEntity method on searchIndex
  searchIndex.updateEntity(type, entity);
}

/**
 * Remove an entity from the search index
 */
export function removeEntity(type: SearchEntityType, id: string): void {
  searchIndex.removeEntity(type, id);
}

// ============================================================================
// Search Service Export
// ============================================================================

export const searchService = {
  search,
  initializeSearchIndex,
  isIndexReady,
  getIndexStats,
  rebuildIndex,
  updateEntity,
  removeEntity,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
};

export default searchService;
