/**
 * TableRowSkeleton - Loading skeleton for table rows
 *
 * A flexible skeleton for list/table views. Can be used for list view modes
 * of services, packages, products, etc. Shows animated placeholders that
 * simulate a typical row layout with icon, text content, and actions.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface TableRowSkeletonProps {
  /** Number of columns to show (default: 5) */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
}

export function TableRowSkeleton({
  columns = 5,
  className,
}: TableRowSkeletonProps) {
  // Generate column widths based on count
  const getColumnWidths = () => {
    switch (columns) {
      case 3:
        return ['w-1/3', 'w-1/4', 'w-1/6'];
      case 4:
        return ['w-1/4', 'w-1/5', 'w-1/6', 'w-1/8'];
      case 5:
      default:
        return ['w-1/4', 'w-1/5', 'w-1/6', 'w-1/8', 'w-1/12'];
    }
  };

  const widths = getColumnWidths();

  return (
    <div
      className={`bg-white border-b border-gray-100 p-4 flex items-center gap-4 ${className || ''}`}
    >
      {/* Checkbox/Drag handle placeholder */}
      <Skeleton className="w-5 h-5 rounded" />

      {/* Main content columns */}
      {widths.map((width, index) => (
        <div key={index} className={`${width}`}>
          {index === 0 ? (
            // First column: larger with icon
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ) : (
            // Other columns: simple text
            <Skeleton className="h-4 w-full" />
          )}
        </div>
      ))}

      {/* Actions placeholder */}
      <Skeleton className="w-8 h-8 rounded ml-auto" />
    </div>
  );
}

export default TableRowSkeleton;
