import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import clsx from 'clsx';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className,
  size = 'md'
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
    onClear?.();
  }, [onChange, onClear]);

  const sizeClasses = size === 'sm'
    ? 'h-8 text-sm'
    : 'h-10 text-sm';

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div className={clsx('relative', className)}>
      <div className="relative flex items-center">
        <Search
          size={iconSize}
          className={clsx(
            'absolute left-3 transition-colors',
            isFocused ? 'text-slate-600' : 'text-slate-400'
          )}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={clsx(
            sizeClasses,
            'w-full pl-10 pr-10 rounded-lg border transition-all duration-200',
            'focus:outline-none focus:ring-2',
            isFocused
              ? 'border-slate-300 ring-slate-200 bg-white'
              : 'border-slate-200 bg-slate-50',
            'placeholder:text-slate-400'
          )}
          aria-label="Search tickets"
        />
        {value && (
          <button
            onClick={handleClear}
            className={clsx(
              'absolute right-2 p-1 rounded-md',
              'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
              'transition-all duration-200'
            )}
            aria-label="Clear search"
            type="button"
          >
            <X size={iconSize} />
          </button>
        )}
      </div>
    </div>
  );
}
