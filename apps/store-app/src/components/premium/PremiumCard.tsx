/**
 * PremiumCard Component
 * Beautiful card with elevation, glass effect, and hover states
 */

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type CardVariant =
  | 'default'    // Standard card with border and shadow
  | 'elevated'   // Raised card with larger shadow
  | 'premium'    // Premium card with hover lift effect
  | 'glass'      // Glass morphism effect
  | 'outline';   // Just border, no shadow

export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  children: React.ReactNode;
}

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = cn(
      'rounded-xl',
      'transition-all duration-200'
    );

    // Padding classes
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    // Variant classes
    const variantClasses = {
      default: cn(
        'bg-white',
        'border border-gray-200',
        'shadow-sm'
      ),
      elevated: cn(
        'bg-white',
        'border border-gray-200',
        'shadow-md',
        hoverable && 'hover:shadow-lg'
      ),
      premium: cn(
        'bg-white',
        'border border-gray-200',
        'shadow-lg',
        'hover:shadow-xl hover:-translate-y-0.5'
      ),
      glass: cn(
        'bg-white/80',
        'backdrop-blur-xl',
        'border border-white/30',
        'shadow-lg',
        hoverable && 'hover:bg-white/90 hover:shadow-xl'
      ),
      outline: cn(
        'bg-white',
        'border-2 border-gray-200',
        hoverable && 'hover:border-gray-300 hover:shadow-sm'
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          paddingClasses[padding],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCard.displayName = 'PremiumCard';

// ============================================================================
// CARD HEADER
// ============================================================================

export interface PremiumCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const PremiumCardHeader = forwardRef<HTMLDivElement, PremiumCardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between',
          'pb-4 border-b border-gray-100',
          className
        )}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    );
  }
);

PremiumCardHeader.displayName = 'PremiumCardHeader';

// ============================================================================
// CARD CONTENT
// ============================================================================

export interface PremiumCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PremiumCardContent = forwardRef<HTMLDivElement, PremiumCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('pt-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCardContent.displayName = 'PremiumCardContent';

// ============================================================================
// CARD FOOTER
// ============================================================================

export interface PremiumCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PremiumCardFooter = forwardRef<HTMLDivElement, PremiumCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          'pt-4 mt-4 border-t border-gray-100',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCardFooter.displayName = 'PremiumCardFooter';
