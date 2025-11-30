import React from 'react';

// Toggle Switch Component
interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}) => {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'h-3 w-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'h-6 w-6', translate: 'translate-x-7' },
  };

  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && (
            <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              {label}
            </span>
          )}
          {description && (
            <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'} mt-0.5`}>
              {description}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0 ${sizes[size].track}
          border-2 border-transparent rounded-full cursor-pointer
          transition-colors ease-in-out duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${enabled ? 'bg-cyan-500' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block ${sizes[size].thumb}
            rounded-full bg-white shadow-lg transform ring-0
            transition ease-in-out duration-200
            ${enabled ? sizes[size].translate : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, icon }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center text-cyan-600">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Card Container Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-100 shadow-sm
        ${paddings[padding]}
        ${hover ? 'hover:shadow-md hover:border-gray-200 cursor-pointer transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Input Field Component
interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'time';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  disabled = false,
  required = false,
  prefix,
  suffix,
}) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {prefix}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          block w-full rounded-lg border transition-colors duration-200
          ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'} py-2.5
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-200 focus:border-cyan-500 focus:ring-cyan-500'
          }
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900'}
          focus:outline-none focus:ring-2 focus:ring-opacity-50
          placeholder:text-gray-400 text-sm
        `}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          {suffix}
        </div>
      )}
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// Select Field Component
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
  required = false,
}) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        block w-full rounded-lg border transition-colors duration-200
        px-4 py-2.5 pr-10 appearance-none bg-no-repeat
        ${error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-200 focus:border-cyan-500 focus:ring-cyan-500'
        }
        ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900'}
        focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm
      `}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundSize: '1.5em 1.5em',
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  dotColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  dotColor,
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    outline: 'bg-transparent border border-gray-300 text-gray-600',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]} ${sizes[size]}
      `}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
};

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  type = 'button',
}) => {
  const variants = {
    primary: 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};

// Tabs Component
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'buttons';
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, variant = 'underline' }) => {
  if (variant === 'pills') {
    return (
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${activeTab === tab.id ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-200 text-gray-600'}
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 py-3 text-sm font-medium border-b-2
              transition-colors duration-200
              ${activeTab === tab.id
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${activeTab === tab.id ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {icon && (
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

// Divider Component
interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200" />
    </div>
    {label && (
      <div className="relative flex justify-center">
        <span className="px-3 bg-white text-sm text-gray-500">{label}</span>
      </div>
    )}
  </div>
);

// Avatar Component
interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', status }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-emerald-400',
    offline: 'bg-gray-400',
    busy: 'bg-red-400',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div
          className={`
            ${sizes[size]} rounded-full flex items-center justify-center
            bg-gradient-to-br from-cyan-400 to-cyan-600 text-white font-medium
            ring-2 ring-white
          `}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 block rounded-full ring-2 ring-white
            ${statusSizes[size]} ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
};

// Checkbox Component
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => (
  <label className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
    <div className="relative flex items-center justify-center mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center
          transition-all duration-200
          ${checked
            ? 'bg-cyan-500 border-cyan-500'
            : 'bg-white border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
    {(label || description) && (
      <div className="flex-1">
        {label && (
          <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {label}
          </span>
        )}
        {description && (
          <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'} mt-0.5`}>
            {description}
          </p>
        )}
      </div>
    )}
  </label>
);

// Textarea Component
interface TextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
}) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      maxLength={maxLength}
      className={`
        block w-full rounded-lg border transition-colors duration-200
        px-4 py-2.5 resize-none
        ${error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-200 focus:border-cyan-500 focus:ring-cyan-500'
        }
        ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900'}
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        placeholder:text-gray-400 text-sm
      `}
    />
    <div className="flex justify-between items-center">
      {error && <p className="text-xs text-red-500">{error}</p>}
      {maxLength && (
        <p className="text-xs text-gray-400 ml-auto">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  </div>
);
