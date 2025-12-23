/**
 * PremiumBadge Component
 * Status badges, labels, and tags with modern design
 */

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'default'   // Gray
  | 'primary'   // Brand (Golden Amber)
  | 'success'   // Green
  | 'warning'   // Amber
  | 'error'     // Red
  | 'info'      // Blue
  | 'purple'    // Purple
  | 'pink';     // Pink

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface PremiumBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;  // Show status dot
  outline?: boolean;  // Outline style
  children: React.ReactNode;
}

export const PremiumBadge = forwardRef<HTMLSpanElement, PremiumBadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      outline = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = cn(
      'inline-flex items-center gap-1.5',
      'font-medium',
      'rounded-full',
      'transition-colors duration-200'
    );

    // Size classes
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    // Variant classes (solid)
    const solidVariants = {
      default: 'bg-gray-100 text-gray-700',
      primary: 'bg-brand-100 text-brand-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-amber-100 text-amber-700',
      error: 'bg-red-100 text-red-700',
      info: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      pink: 'bg-pink-100 text-pink-700',
    };

    // Variant classes (outline)
    const outlineVariants = {
      default: 'border border-gray-300 text-gray-700 bg-white',
      primary: 'border border-brand-300 text-brand-700 bg-white',
      success: 'border border-green-300 text-green-700 bg-white',
      warning: 'border border-amber-300 text-amber-700 bg-white',
      error: 'border border-red-300 text-red-700 bg-white',
      info: 'border border-blue-300 text-blue-700 bg-white',
      purple: 'border border-purple-300 text-purple-700 bg-white',
      pink: 'border border-pink-300 text-pink-700 bg-white',
    };

    // Dot colors
    const dotColors = {
      default: 'bg-gray-500',
      primary: 'bg-brand-500',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          outline ? outlineVariants[variant] : solidVariants[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColors[variant]
          )} />
        )}
        {children}
      </span>
    );
  }
);

PremiumBadge.displayName = 'PremiumBadge';

// ============================================================================
// STATUS BADGE (Specialized for appointment statuses)
// ============================================================================

export interface StatusBadgeProps {
  status: 'scheduled' | 'checked-in' | 'in-service' | 'completed' | 'cancelled' | 'no-show';
  showDot?: boolean;
  size?: BadgeSize;
  className?: string;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showDot = true, size = 'md', className }, ref) => {
    const statusConfig = {
      scheduled: { label: 'Scheduled', variant: 'info' as BadgeVariant },
      'checked-in': { label: 'Checked In', variant: 'primary' as BadgeVariant },
      'in-service': { label: 'In Service', variant: 'warning' as BadgeVariant },
      completed: { label: 'Completed', variant: 'success' as BadgeVariant },
      cancelled: { label: 'Cancelled', variant: 'error' as BadgeVariant },
      'no-show': { label: 'No Show', variant: 'default' as BadgeVariant },
    };

    const config = statusConfig[status];

    return (
      <PremiumBadge
        ref={ref}
        variant={config.variant}
        size={size}
        dot={showDot}
        className={className}
      >
        {config.label}
      </PremiumBadge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
