/**
 * PremiumInput Component
 * Beautiful form inputs with labels, icons, and validation states
 */

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface PremiumInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  (
    {
      label,
      hint,
      error,
      icon,
      iconRight,
      size = 'md',
      fullWidth = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    // Base input classes
    const baseClasses = cn(
      'block',
      'rounded-lg',
      'border',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
      'placeholder:text-gray-400',
      fullWidth && 'w-full'
    );

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    // With icon padding
    const iconPaddingLeft = icon ? {
      sm: 'pl-9',
      md: 'pl-10',
      lg: 'pl-12',
    } : {};

    const iconPaddingRight = iconRight ? {
      sm: 'pr-9',
      md: 'pr-10',
      lg: 'pr-12',
    } : {};

    // State classes
    const stateClasses = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500';

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {icon && (
            <div className={cn(
              'absolute left-0 top-0 bottom-0',
              'flex items-center',
              size === 'sm' && 'pl-3',
              size === 'md' && 'pl-3',
              size === 'lg' && 'pl-4',
              'text-gray-400'
            )}>
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              baseClasses,
              sizeClasses[size],
              icon && iconPaddingLeft[size],
              iconRight && iconPaddingRight[size],
              stateClasses,
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {iconRight && (
            <div className={cn(
              'absolute right-0 top-0 bottom-0',
              'flex items-center',
              size === 'sm' && 'pr-3',
              size === 'md' && 'pr-3',
              size === 'lg' && 'pr-4',
              'text-gray-400'
            )}>
              {iconRight}
            </div>
          )}
        </div>

        {/* Hint or Error */}
        {(hint || error) && (
          <p className={cn(
            'text-xs mt-1.5',
            error ? 'text-red-600' : 'text-gray-600'
          )}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

// ============================================================================
// TEXTAREA VARIANT
// ============================================================================

export interface PremiumTextareaProps extends Omit<InputHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
  fullWidth?: boolean;
}

export const PremiumTextarea = forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  (
    {
      label,
      hint,
      error,
      rows = 4,
      fullWidth = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = cn(
      'block',
      'rounded-lg',
      'border',
      'px-4 py-2.5 text-sm',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
      'placeholder:text-gray-400',
      'resize-y',
      fullWidth && 'w-full'
    );

    // State classes
    const stateClasses = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500';

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={cn(
            baseClasses,
            stateClasses,
            className
          )}
          {...props as any}
        />

        {/* Hint or Error */}
        {(hint || error) && (
          <p className={cn(
            'text-xs mt-1.5',
            error ? 'text-red-600' : 'text-gray-600'
          )}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

PremiumTextarea.displayName = 'PremiumTextarea';

// ============================================================================
// SELECT VARIANT
// ============================================================================

export interface PremiumSelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

export const PremiumSelect = forwardRef<HTMLSelectElement, PremiumSelectProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
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
      'block',
      'rounded-lg',
      'border',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
      'appearance-none',
      'bg-white',
      fullWidth && 'w-full'
    );

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 pr-8 text-sm',
      md: 'px-4 py-2 pr-10 text-sm',
      lg: 'px-4 py-3 pr-12 text-base',
    };

    // State classes
    const stateClasses = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500';

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              baseClasses,
              sizeClasses[size],
              stateClasses,
              className
            )}
            {...props as any}
          >
            {children}
          </select>

          {/* Dropdown icon */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Hint or Error */}
        {(hint || error) && (
          <p className={cn(
            'text-xs mt-1.5',
            error ? 'text-red-600' : 'text-gray-600'
          )}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

PremiumSelect.displayName = 'PremiumSelect';
