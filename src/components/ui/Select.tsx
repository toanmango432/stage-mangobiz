import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

/**
 * Standardized Select component using design tokens from tailwind.config.js
 * 
 * Features:
 * - Optional label and error messages
 * - Custom chevron icon
 * - Focus states with brand colors
 * - Full width option
 * 
 * @example
 * <Select label="Status" fullWidth>
 *   <option value="active">Active</option>
 *   <option value="inactive">Inactive</option>
 * </Select>
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            helperText,
            fullWidth = false,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const hasError = !!error;

        // Base select styles
        const baseStyles = `
      px-3 py-2 pr-10 rounded-lg appearance-none
      bg-white border transition-all duration-200
      text-sm text-gray-900
      focus:outline-none focus:ring-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
      ${fullWidth ? 'w-full' : ''}
    `;

        // State-based styles
        const stateStyles = hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20';

        return (
            <div className={fullWidth ? 'w-full' : ''}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                    </label>
                )}

                <div className="relative">
                    <select
                        ref={ref}
                        className={`
              ${baseStyles}
              ${stateStyles}
              ${className}
            `}
                        {...props}
                    >
                        {children}
                    </select>

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                    </div>
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

Select.displayName = 'Select';
