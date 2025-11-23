import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
}

/**
 * Standardized Badge component using design tokens from tailwind.config.js
 * 
 * Variants:
 * - default: Gray
 * - success: Green
 * - warning: Yellow/Amber
 * - danger: Red
 * - info: Blue
 * 
 * @example
 * <Badge variant="success" size="md">
 *   Active
 * </Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    (
        {
            variant = 'default',
            size = 'md',
            dot = false,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        // Base styles
        const baseStyles = `
      inline-flex items-center gap-1.5 font-medium
      rounded-full transition-all duration-200
    `;

        // Size variants
        const sizeStyles = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-1 text-xs',
            lg: 'px-3 py-1.5 text-sm',
        };

        // Color variants
        const variantStyles = {
            default: 'bg-gray-100 text-gray-700',
            success: 'bg-green-100 text-green-700',
            warning: 'bg-amber-100 text-amber-700',
            danger: 'bg-red-100 text-red-700',
            info: 'bg-blue-100 text-blue-700',
        };

        // Dot colors
        const dotColors = {
            default: 'bg-gray-500',
            success: 'bg-green-500',
            warning: 'bg-amber-500',
            danger: 'bg-red-500',
            info: 'bg-blue-500',
        };

        return (
            <span
                ref={ref}
                className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${className}
        `}
                {...props}
            >
                {dot && (
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
                    />
                )}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
