/**
 * PremiumButton Component
 * Beautiful, accessible button with multiple variants
 */

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant =
  | 'primary'       // Gradient teal (main CTA)
  | 'secondary'     // Outlined teal
  | 'ghost'         // Transparent with hover
  | 'danger'        // Red (destructive actions)
  | 'success'       // Green (confirmations)
  | 'outline'       // Gray outline (secondary actions)
  | 'link';         // Plain text link

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconRight,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium',
      'rounded-lg',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'active:scale-[0.98]', // Press animation
      fullWidth && 'w-full'
    );

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
      xl: 'px-8 py-3 text-base',
    };

    // Variant classes
    const variantClasses = {
      primary: cn(
        'bg-gradient-to-r from-teal-500 to-cyan-600',
        'text-white',
        'shadow-md hover:shadow-lg',
        'hover:from-teal-600 hover:to-cyan-700',
        'focus:ring-teal-500'
      ),
      secondary: cn(
        'border-2 border-teal-500',
        'text-teal-700',
        'hover:bg-teal-50',
        'focus:ring-teal-500'
      ),
      ghost: cn(
        'text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-gray-400'
      ),
      danger: cn(
        'bg-red-500',
        'text-white',
        'shadow-sm hover:shadow-md',
        'hover:bg-red-600',
        'focus:ring-red-500'
      ),
      success: cn(
        'bg-green-500',
        'text-white',
        'shadow-sm hover:shadow-md',
        'hover:bg-green-600',
        'focus:ring-green-500'
      ),
      outline: cn(
        'border-2 border-gray-300',
        'text-gray-700',
        'hover:bg-gray-50 hover:border-gray-400',
        'focus:ring-gray-400'
      ),
      link: cn(
        'text-teal-600',
        'hover:text-teal-700 hover:underline',
        'focus:ring-teal-500',
        'px-0' // Remove padding for link style
      ),
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Left icon */}
        {!isLoading && icon && <span className="flex-shrink-0">{icon}</span>}

        {/* Content */}
        <span>{children}</span>

        {/* Right icon */}
        {!isLoading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

// ============================================================================
// ICON BUTTON VARIANT
// ============================================================================

export interface PremiumIconButtonProps extends Omit<PremiumButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const PremiumIconButton = forwardRef<HTMLButtonElement, PremiumIconButtonProps>(
  ({ icon, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-lg',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          sizeClasses[size],
          props.variant === 'ghost'
            ? 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400'
            : props.variant === 'primary'
            ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md hover:shadow-lg focus:ring-teal-500'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
          props.className
        )}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

PremiumIconButton.displayName = 'PremiumIconButton';
