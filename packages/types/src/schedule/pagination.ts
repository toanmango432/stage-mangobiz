/**
 * Schedule Module Pagination Types
 * Cursor-based pagination for scalable data fetching
 */

/**
 * Parameters for paginated queries
 */
export interface PaginationParams {
  /** Number of items per page (default: 50) */
  limit?: number;
  /** Cursor for the next page (ID of last item from previous page) */
  cursor?: string;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result wrapper for paginated queries
 */
export interface PaginatedResult<T> {
  /** The items for the current page */
  items: T[];
  /** Pagination metadata */
  pagination: {
    /** Total count of all items matching the query */
    total: number;
    /** Whether there are more items after this page */
    hasMore: boolean;
    /** Cursor for the next page (null if no more pages) */
    nextCursor: string | null;
    /** Cursor for the previous page (null if on first page) */
    prevCursor: string | null;
  };
}

/**
 * Filters for time-off requests
 */
export interface TimeOffRequestFilters {
  /** Filter by status */
  status?: 'all' | 'pending' | 'approved' | 'denied' | 'cancelled';
  /** Filter by staff member */
  staffId?: string | null;
  /** Filter by time-off type */
  typeId?: string | null;
  /** Filter by date range */
  dateRange?: 'upcoming' | 'past' | 'all' | CustomDateRange;
}

/**
 * Custom date range for filtering
 */
export interface CustomDateRange {
  start: string;
  end: string;
}

/**
 * Type guard to check if dateRange is a custom range
 */
export function isCustomDateRange(
  dateRange: TimeOffRequestFilters['dateRange']
): dateRange is CustomDateRange {
  return typeof dateRange === 'object' && dateRange !== null && 'start' in dateRange;
}

/**
 * Filters for blocked time entries
 */
export interface BlockedTimeEntryFilters {
  /** Filter by staff member */
  staffId?: string | null;
  /** Filter by blocked time type */
  typeId?: string | null;
  /** Filter by date range */
  dateRange?: CustomDateRange;
  /** Include recurring entries */
  includeRecurring?: boolean;
}

/**
 * Filters for resource bookings
 */
export interface ResourceBookingFilters {
  /** Filter by resource */
  resourceId?: string | null;
  /** Filter by staff member */
  staffId?: string | null;
  /** Filter by appointment */
  appointmentId?: string | null;
  /** Filter by date range */
  dateRange?: CustomDateRange;
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION: Required<Pick<PaginationParams, 'limit' | 'sortOrder'>> = {
  limit: 50,
  sortOrder: 'desc',
};

/**
 * Helper to create an empty paginated result
 */
export function emptyPaginatedResult<T>(): PaginatedResult<T> {
  return {
    items: [],
    pagination: {
      total: 0,
      hasMore: false,
      nextCursor: null,
      prevCursor: null,
    },
  };
}
