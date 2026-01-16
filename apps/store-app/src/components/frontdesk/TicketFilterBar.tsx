/**
 * TicketFilterBar - Filter chips for ticket filtering in WaitListSection
 *
 * Allows filtering by: All | Priority | VIP | First Visit | Long Wait (10+ min)
 * Supports multiple active filters (toggle on/off)
 * Shows active filter count badge and clear all button
 */

import { memo, useCallback, useMemo } from 'react';
import { Star, Crown, Sparkles, Clock, X } from 'lucide-react';

// Filter types that can be active
export type TicketFilterType = 'priority' | 'vip' | 'firstVisit' | 'longWait';

// Filter configuration
export interface TicketFilter {
  id: TicketFilterType;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

// Props for the filter bar
export interface TicketFilterBarProps {
  /** Currently active filters */
  activeFilters: Set<TicketFilterType>;
  /** Callback when filters change */
  onFiltersChange: (filters: Set<TicketFilterType>) => void;
  /** Counts for each filter type (for badges) */
  filterCounts?: Partial<Record<TicketFilterType, number>>;
  /** Total ticket count */
  totalCount?: number;
  /** Whether the component is in a compact mode */
  compact?: boolean;
}

// Filter definitions with icons
const FILTERS: TicketFilter[] = [
  {
    id: 'priority',
    label: 'Priority',
    icon: <Star size={14} />,
    description: 'High priority tickets',
  },
  {
    id: 'vip',
    label: 'VIP',
    icon: <Crown size={14} />,
    description: 'VIP client tickets',
  },
  {
    id: 'firstVisit',
    label: 'First Visit',
    icon: <Sparkles size={14} />,
    description: 'First-time clients',
  },
  {
    id: 'longWait',
    label: 'Long Wait',
    icon: <Clock size={14} />,
    description: 'Waiting 10+ minutes',
  },
];

/**
 * Calculate filter counts from a list of tickets
 * Returns counts for each filter type based on ticket properties
 */
export function calculateFilterCounts(
  tickets: Array<{
    priority?: 'normal' | 'high';
    clientType?: string;
    isFirstVisit?: boolean;
    createdAt?: Date | string;
    time?: string | Date;
  }>
): Record<TicketFilterType, number> {
  const now = Date.now();
  const LONG_WAIT_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

  return tickets.reduce(
    (counts, ticket) => {
      // Priority filter
      if (ticket.priority === 'high') {
        counts.priority++;
      }

      // VIP filter
      if (ticket.clientType?.toLowerCase() === 'vip') {
        counts.vip++;
      }

      // First Visit filter
      if (ticket.isFirstVisit) {
        counts.firstVisit++;
      }

      // Long Wait filter (10+ minutes)
      const checkInTime = ticket.createdAt || ticket.time;
      if (checkInTime) {
        const checkInDate = checkInTime instanceof Date
          ? checkInTime
          : new Date(checkInTime);
        const waitTimeMs = now - checkInDate.getTime();
        if (waitTimeMs >= LONG_WAIT_THRESHOLD_MS) {
          counts.longWait++;
        }
      }

      return counts;
    },
    {
      priority: 0,
      vip: 0,
      firstVisit: 0,
      longWait: 0,
    }
  );
}

/**
 * Apply filters to a list of tickets
 * Returns tickets that match ANY of the active filters (OR logic)
 */
export function applyTicketFilters<
  T extends {
    priority?: 'normal' | 'high';
    clientType?: string;
    isFirstVisit?: boolean;
    createdAt?: Date | string;
    time?: string | Date;
  }
>(tickets: T[], activeFilters: Set<TicketFilterType>): T[] {
  // If no filters active, return all tickets
  if (activeFilters.size === 0) {
    return tickets;
  }

  const now = Date.now();
  const LONG_WAIT_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

  return tickets.filter((ticket) => {
    // Check each active filter (OR logic - match any filter)
    for (const filter of activeFilters) {
      switch (filter) {
        case 'priority':
          if (ticket.priority === 'high') return true;
          break;
        case 'vip':
          if (ticket.clientType?.toLowerCase() === 'vip') return true;
          break;
        case 'firstVisit':
          if (ticket.isFirstVisit) return true;
          break;
        case 'longWait': {
          const checkInTime = ticket.createdAt || ticket.time;
          if (checkInTime) {
            const checkInDate =
              checkInTime instanceof Date ? checkInTime : new Date(checkInTime);
            const waitTimeMs = now - checkInDate.getTime();
            if (waitTimeMs >= LONG_WAIT_THRESHOLD_MS) return true;
          }
          break;
        }
      }
    }
    return false;
  });
}

export const TicketFilterBar = memo(function TicketFilterBar({
  activeFilters,
  onFiltersChange,
  filterCounts = {},
  totalCount = 0,
  compact = false,
}: TicketFilterBarProps) {
  // Toggle a filter on/off
  const toggleFilter = useCallback(
    (filterId: TicketFilterType) => {
      const newFilters = new Set(activeFilters);
      if (newFilters.has(filterId)) {
        newFilters.delete(filterId);
      } else {
        newFilters.add(filterId);
      }
      onFiltersChange(newFilters);
    },
    [activeFilters, onFiltersChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange(new Set());
  }, [onFiltersChange]);

  // Count of active filters
  const activeFilterCount = activeFilters.size;

  // Check if any filter has non-zero count
  const hasFilterableTickets = useMemo(() => {
    return Object.values(filterCounts).some((count) => count && count > 0);
  }, [filterCounts]);

  // Don't render if no tickets or no filterable tickets
  if (totalCount === 0 && !hasFilterableTickets) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* All filter (shows when any filter is active) */}
      <button
        onClick={clearAllFilters}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-150 border
          ${activeFilterCount === 0
            ? 'bg-slate-900 text-white border-slate-900'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        <span>All</span>
        {totalCount > 0 && (
          <span
            className={`
              text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
              ${activeFilterCount === 0
                ? 'bg-slate-700 text-slate-200'
                : 'bg-slate-100 text-slate-500'
              }
            `}
          >
            {totalCount}
          </span>
        )}
      </button>

      {/* Filter chips */}
      {FILTERS.map((filter) => {
        const isActive = activeFilters.has(filter.id);
        const count = filterCounts[filter.id] || 0;

        // In compact mode, hide filters with zero count (unless active)
        if (compact && count === 0 && !isActive) {
          return null;
        }

        return (
          <button
            key={filter.id}
            onClick={() => toggleFilter(filter.id)}
            disabled={count === 0 && !isActive}
            title={filter.description}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-150 border
              ${isActive
                ? 'bg-slate-900 text-white border-slate-900'
                : count > 0
                  ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span className={isActive ? 'text-white' : count > 0 ? 'text-slate-500' : 'text-slate-400'}>
              {filter.icon}
            </span>
            <span>{filter.label}</span>
            {count > 0 && (
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${isActive
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-slate-100 text-slate-500'
                  }
                `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* Clear filters button (shows when filters are active) */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium
                     text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={12} />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
});
