import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

/**
 * Standardized Button component using design tokens from tailwind.config.js
 * 
 * Variants:
 * - primary: Brand teal color (brand-600)
 * - secondary: Gray outline
 * - ghost: Transparent with hover
 * - danger: Red for destructive actions
 * - success: Green for confirmations
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Save Changes
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            icon,
            fullWidth = false,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        // Base styles - consistent across all variants
        const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium
      transition-all duration-200 ease-smooth
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${fullWidth ? 'w-full' : ''}
    `;

        // Size variants
        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm rounded-lg',
            md: 'px-4 py-2 text-sm rounded-lg',
            lg: 'px-6 py-3 text-base rounded-xl',
        };

        // Color variants using design tokens
        const variantStyles = {
            primary: `
        bg-brand-600 text-white
        hover:bg-brand-700 active:bg-brand-800
        shadow-premium-sm hover:shadow-premium-md
        focus:ring-brand-500
      `,
            secondary: `
        bg-white text-gray-700 border border-gray-300
        hover:bg-gray-50 active:bg-gray-100
        shadow-premium-xs hover:shadow-premium-sm
        focus:ring-gray-400
      `,
            ghost: `
        bg-transparent text-gray-700
        hover:bg-gray-100 active:bg-gray-200
        focus:ring-gray-400
      `,
            danger: `
        bg-red-600 text-white
        hover:bg-red-700 active:bg-red-800
        shadow-premium-sm hover:shadow-premium-md
        focus:ring-red-500
      `,
            success: `
        bg-green-600 text-white
        hover:bg-green-700 active:bg-green-800
        shadow-premium-sm hover:shadow-premium-md
        focus:ring-green-500
      `,
        };

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${className}
        `}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
                {children && <span>{children}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
