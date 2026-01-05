import React, { useRef, useCallback } from 'react';
import { SegmentedControlProps } from '../types';

// Segmented Control Component with ARIA tablist pattern and keyboard navigation
export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  name,
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // A11Y-002: Keyboard navigation with arrow keys
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    if (disabled) return;

    let newIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = options.length - 1;
    } else {
      return;
    }

    // Update selection and focus
    onChange(options[newIndex].value);
    const buttons = containerRef.current?.querySelectorAll('button');
    buttons?.[newIndex]?.focus();
  }, [disabled, options, onChange]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={name}
      className="flex p-0.5 bg-gray-100 rounded-lg w-full max-w-md"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          disabled={disabled}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
            value === option.value
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !disabled && onChange(option.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};