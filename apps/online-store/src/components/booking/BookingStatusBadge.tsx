/**
 * Booking Status Badge Component
 *
 * Displays the current booking status with appropriate styling.
 * Updates in real-time when connected to Supabase Realtime.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, Star, AlertCircle } from 'lucide-react';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: typeof Clock;
  colorClass: string;
}> = {
  pending: {
    label: 'Pending Confirmation',
    variant: 'secondary',
    icon: Clock,
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'default',
    icon: CheckCircle2,
    colorClass: 'bg-green-100 text-green-800 border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    icon: XCircle,
    colorClass: 'bg-red-100 text-red-800 border-red-200',
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    icon: Star,
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  no_show: {
    label: 'No Show',
    variant: 'destructive',
    icon: AlertCircle,
    colorClass: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

export function BookingStatusBadge({
  status,
  className,
  showIcon = true,
  size = 'default',
}: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.colorClass,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </Badge>
  );
}

/**
 * Get status display info without rendering a badge
 */
export function getStatusInfo(status: BookingStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

export default BookingStatusBadge;
