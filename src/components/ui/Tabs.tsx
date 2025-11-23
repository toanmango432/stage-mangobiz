import { HTMLAttributes, forwardRef } from 'react';

export interface TabProps extends HTMLAttributes<HTMLButtonElement> {
    value: string;
    active?: boolean;
    label: React.ReactNode;
    badge?: React.ReactNode;
    onClick?: () => void;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    variant?: 'default' | 'pills' | 'underline';
}

/**
 * Standardized Tabs component
 * 
 * @example
 * <Tabs value={activeTab} onChange={setActiveTab}>
 *   <Tab value="tab1" label="Tab 1" />
 *   <Tab value="tab2" label="Tab 2" badge={5} />
 * </Tabs>
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
    (
        {
            value,
            onChange,
            variant = 'underline',
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={`flex items-center gap-1 border-b border-gray-200 ${className}`}
                {...props}
            >
                {/* We need to clone children to pass the active state and onClick handler */}
                {Array.isArray(children)
                    ? children.map((child: any) => {
                        if (!child) return null;
                        return {
                            ...child,
                            props: {
                                ...child.props,
                                active: child.props.value === value,
                                onClick: () => onChange(child.props.value),
                                variant, // Pass variant down if needed
                            },
                        };
                    })
                    : children && {
                        ...(children as any),
                        props: {
                            ...(children as any).props,
                            active: (children as any).props.value === value,
                            onClick: () => onChange((children as any).props.value),
                            variant,
                        },
                    }}
            </div>
        );
    }
);

Tabs.displayName = 'Tabs';

export const Tab = forwardRef<HTMLButtonElement, TabProps & { variant?: string }>(
    (
        {
            value,
            active,
            label,
            badge,
            onClick,
            variant = 'underline',
            className = '',
            ...props
        },
        ref
    ) => {
        // Base styles
        const baseStyles = `
      px-4 py-2 font-medium text-sm transition-all duration-200 relative
      focus:outline-none
    `;

        // Variant styles
        const variantStyles = {
            underline: `
        rounded-t-lg -mb-px
        ${active
                    ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
      `,
            pills: `
        rounded-lg
        ${active
                    ? 'bg-brand-600 text-white shadow-premium-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }
      `,
            default: ''
        };

        return (
            <button
                ref={ref}
                onClick={onClick}
                className={`
          ${baseStyles}
          ${variantStyles[variant as keyof typeof variantStyles]}
          ${className}
        `}
                role="tab"
                aria-selected={active}
                {...props}
            >
                <div className="flex items-center gap-2">
                    {label}
                    {badge && (
                        <span
                            className={`
                px-1.5 py-0.5 rounded-full text-xs font-semibold
                ${active
                                    ? variant === 'pills' ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                                    : 'bg-gray-100 text-gray-600'
                                }
              `}
                        >
                            {badge}
                        </span>
                    )}
                </div>
            </button>
        );
    }
);

Tab.displayName = 'Tab';
