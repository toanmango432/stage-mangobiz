/**
 * Cursor-Based Pagination Utilities
 *
 * Provides efficient pagination for large datasets.
 * Uses cursor-based pagination (keyset) instead of offset-based
 * for consistent performance at any page depth.
 *
 * Benefits over offset pagination:
 * - O(1) performance vs O(n) for offset
 * - No skipped/duplicated items during concurrent writes
 * - Works well with real-time data
 */

import { supabase } from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationParams {
  /** Number of items per page (default: 50) */
  limit?: number;
  /** Cursor for the next page (from previous response) */
  cursor?: string;
  /** Sort direction */
  direction?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  /** Array of items for this page */
  data: T[];
  /** Cursor for fetching the next page (null if no more) */
  nextCursor: string | null;
  /** Whether there are more items */
  hasMore: boolean;
  /** Total count (optional, expensive for large tables) */
  totalCount?: number;
}

export interface CursorConfig {
  /** Column to use for cursor (must be unique + sortable) */
  cursorColumn: string;
  /** Sort column (can be different from cursor) */
  sortColumn?: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

// ============================================================================
// CURSOR UTILITIES
// ============================================================================

/**
 * Encode cursor value for URL safety
 * Uses btoa for browser compatibility (Buffer is Node.js only)
 */
export function encodeCursor(value: string | number | Date): string {
  const str = value instanceof Date ? value.toISOString() : String(value);
  return btoa(str);
}

/**
 * Decode cursor back to original value
 * Uses atob for browser compatibility
 */
export function decodeCursor(cursor: string): string {
  try {
    return atob(cursor);
  } catch {
    return cursor;
  }
}

// ============================================================================
// PAGINATED QUERIES
// ============================================================================

/**
 * Fetch clients with cursor-based pagination
 */
export async function getClientsPaginated(
  storeId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<any>> {
  const { limit = 50, cursor, direction = 'desc' } = params;

  let query = supabase
    .from('clients')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: direction === 'asc' })
    .limit(limit + 1); // Fetch one extra to check hasMore

  // Apply cursor filter
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (direction === 'desc') {
      query = query.lt('created_at', decodedCursor);
    } else {
      query = query.gt('created_at', decodedCursor);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Pagination] Error fetching clients:', error);
    throw error;
  }

  const hasMore = data && data.length > limit;
  const items = hasMore ? data.slice(0, limit) : (data || []);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem
    ? encodeCursor(lastItem.created_at)
    : null;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}

/**
 * Fetch appointments with cursor-based pagination
 */
export async function getAppointmentsPaginated(
  storeId: string,
  dateRange: { start: string; end: string },
  params: PaginationParams = {}
): Promise<PaginatedResult<any>> {
  const { limit = 100, cursor, direction = 'asc' } = params;

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('store_id', storeId)
    .gte('appointment_date', dateRange.start)
    .lte('appointment_date', dateRange.end)
    .order('start_time', { ascending: direction === 'asc' })
    .limit(limit + 1);

  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (direction === 'asc') {
      query = query.gt('start_time', decodedCursor);
    } else {
      query = query.lt('start_time', decodedCursor);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Pagination] Error fetching appointments:', error);
    throw error;
  }

  const hasMore = data && data.length > limit;
  const items = hasMore ? data.slice(0, limit) : (data || []);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem
    ? encodeCursor(lastItem.start_time)
    : null;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}

/**
 * Fetch transactions with cursor-based pagination
 */
export async function getTransactionsPaginated(
  storeId: string,
  params: PaginationParams & { dateRange?: { start: string; end: string } } = {}
): Promise<PaginatedResult<any>> {
  const { limit = 50, cursor, direction = 'desc', dateRange } = params;

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: direction === 'asc' })
    .limit(limit + 1);

  // Optional date range filter
  if (dateRange) {
    query = query
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);
  }

  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (direction === 'desc') {
      query = query.lt('created_at', decodedCursor);
    } else {
      query = query.gt('created_at', decodedCursor);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Pagination] Error fetching transactions:', error);
    throw error;
  }

  const hasMore = data && data.length > limit;
  const items = hasMore ? data.slice(0, limit) : (data || []);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem
    ? encodeCursor(lastItem.created_at)
    : null;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}

/**
 * Fetch tickets with cursor-based pagination
 */
export async function getTicketsPaginated(
  storeId: string,
  params: PaginationParams & { status?: string | string[] } = {}
): Promise<PaginatedResult<any>> {
  const { limit = 50, cursor, direction = 'desc', status } = params;

  let query = supabase
    .from('tickets')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: direction === 'asc' })
    .limit(limit + 1);

  // Optional status filter
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (direction === 'desc') {
      query = query.lt('created_at', decodedCursor);
    } else {
      query = query.gt('created_at', decodedCursor);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Pagination] Error fetching tickets:', error);
    throw error;
  }

  const hasMore = data && data.length > limit;
  const items = hasMore ? data.slice(0, limit) : (data || []);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem
    ? encodeCursor(lastItem.created_at)
    : null;

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}

// ============================================================================
// SEARCH WITH PAGINATION
// ============================================================================

/**
 * Search clients with full-text search and pagination
 */
export async function searchClientsPaginated(
  storeId: string,
  searchQuery: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<any>> {
  const { limit = 50, cursor } = params;

  // Build search query for PostgreSQL full-text search
  const searchTerms = searchQuery
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');

  let query = supabase
    .from('clients')
    .select('*')
    .eq('store_id', storeId)
    .textSearch('search_vector', searchTerms, { type: 'websearch' })
    .limit(limit + 1);

  // Note: For search results, we use offset-based pagination
  // because ranking changes the order
  if (cursor) {
    const offset = parseInt(decodeCursor(cursor), 10);
    query = query.range(offset, offset + limit);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback to ILIKE search if full-text not available
    console.warn('[Pagination] Full-text search failed, using ILIKE:', error);

    const fallbackQuery = supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      .limit(limit + 1);

    const fallback = await fallbackQuery;
    if (fallback.error) throw fallback.error;

    const hasMore = fallback.data && fallback.data.length > limit;
    const items = hasMore ? fallback.data.slice(0, limit) : (fallback.data || []);

    return {
      data: items,
      nextCursor: hasMore ? encodeCursor(String(limit)) : null,
      hasMore,
    };
  }

  const hasMore = data && data.length > limit;
  const items = hasMore ? data.slice(0, limit) : (data || []);
  const currentOffset = cursor ? parseInt(decodeCursor(cursor), 10) : 0;

  return {
    data: items,
    nextCursor: hasMore ? encodeCursor(String(currentOffset + limit)) : null,
    hasMore,
  };
}

// ============================================================================
// HOOK FOR INFINITE SCROLL
// ============================================================================

/**
 * React Query key generator for paginated queries
 */
export function getPaginationQueryKey(
  entity: string,
  storeId: string,
  filters?: Record<string, any>
): (string | Record<string, any>)[] {
  return ['paginated', entity, storeId, filters || {}];
}
