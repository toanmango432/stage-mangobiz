import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
}

/**
 * Standardized Card component using design tokens from tailwind.config.js
 * 
 * Variants:
 * - default: Standard card with subtle shadow
 * - elevated: Higher elevation with stronger shadow
 * - outlined: Border only, no shadow
 * 
 * @example
 * <Card variant="elevated" padding="md" hoverable>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            padding = 'md',
            hoverable = false,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        // Base styles
        const baseStyles = `
      bg-white rounded-xl
      transition-all duration-200 ease-smooth
    `;

        // Padding variants
        const paddingStyles = {
            none: '',
            sm: 'p-3',
            md: 'p-4',
            lg: 'p-6',
        };

        // Variant styles using premium shadows from design tokens
        const variantStyles = {
            default: `
        shadow-premium-sm
        ${hoverable ? 'hover:shadow-premium-md hover:-translate-y-0.5' : ''}
      `,
            elevated: `
        shadow-premium-md
        ${hoverable ? 'hover:shadow-premium-lg hover:-translate-y-1' : ''}
      `,
            outlined: `
        border border-gray-200
        ${hoverable ? 'hover:border-gray-300 hover:shadow-premium-xs' : ''}
      `,
        };

        return (
            <div
                ref={ref}
                className={`
          ${baseStyles}
          ${paddingStyles[padding]}
          ${variantStyles[variant]}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
