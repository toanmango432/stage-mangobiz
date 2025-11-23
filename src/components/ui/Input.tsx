import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

/**
 * Standardized Input component using design tokens from tailwind.config.js
 * 
 * Features:
 * - Optional label and error messages
 * - Icon support (left or right)
 * - Focus states with brand colors
 * - Full width option
 * 
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 *   icon={<Mail size={16} />}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            icon,
            iconPosition = 'left',
            fullWidth = false,
            className = '',
            ...props
        },
        ref
    ) => {
        const hasError = !!error;

        // Base input styles
        const baseStyles = `
      px-3 py-2 rounded-lg
      bg-white border transition-all duration-200
      text-sm text-gray-900 placeholder:text-gray-400
      focus:outline-none focus:ring-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
      ${fullWidth ? 'w-full' : ''}
    `;

        // State-based styles
        const stateStyles = hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20';

        // Icon padding
        const iconPaddingStyles = icon
            ? iconPosition === 'left'
                ? 'pl-10'
                : 'pr-10'
            : '';

        return (
            <div className={fullWidth ? 'w-full' : ''}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {icon && (
                        <div
                            className={`
                absolute top-1/2 -translate-y-1/2 text-gray-400
                ${iconPosition === 'left' ? 'left-3' : 'right-3'}
              `}
                        >
                            {icon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        className={`
              ${baseStyles}
              ${stateStyles}
              ${iconPaddingStyles}
              ${className}
            `}
                        {...props}
                    />
                </div>

                {error && (
                    <p className="mt-1.5 text-sm text-red-600">{error}</p>
                )}

                {!error && helperText && (
                    <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
