/**
 * VirtualList Component
 *
 * Efficiently renders large lists by only rendering visible items.
 * Uses @tanstack/react-virtual for virtualization.
 *
 * Use for:
 * - Client lists (1000s of clients)
 * - Appointment lists
 * - Transaction history
 * - Staff lists (for large chains)
 */

import { useRef, ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Estimated height of each item in pixels (default: 50) */
  estimateSize?: number;
  /** Number of items to render outside visible area (default: 5) */
  overscan?: number;
  /** Container height (default: 100%) */
  height?: string | number;
  /** Optional class name for the container */
  className?: string;
  /** Optional key extractor for items */
  getItemKey?: (item: T, index: number) => string | number;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Render function for loading state */
  renderLoading?: () => ReactNode;
  /** Render function for empty state */
  renderEmpty?: () => ReactNode;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 50,
  overscan = 5,
  height = '100%',
  className = '',
  getItemKey,
  isLoading = false,
  emptyMessage = 'No items to display',
  renderLoading,
  renderEmpty,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(items[index], index)
      : undefined,
  });

  // Loading state
  if (isLoading) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * VirtualGrid Component
 *
 * Efficiently renders large grids by only rendering visible rows.
 */
interface VirtualGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Number of columns */
  columns: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Estimated height of each row in pixels (default: 100) */
  estimateRowSize?: number;
  /** Gap between items in pixels (default: 16) */
  gap?: number;
  /** Container height (default: 100%) */
  height?: string | number;
  /** Optional class name for the container */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

export function VirtualGrid<T>({
  items,
  columns,
  renderItem,
  estimateRowSize = 100,
  gap = 16,
  height = '100%',
  className = '',
  isLoading = false,
  emptyMessage = 'No items to display',
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate rows
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowSize + gap,
    overscan: 2,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                paddingBottom: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex}>
                  {renderItem(item, startIndex + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualList;
