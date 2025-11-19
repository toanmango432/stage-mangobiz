import React from 'react';
import { SegmentedControlProps } from '../types';

// Segmented Control Component
export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  name,
  disabled = false
}) => (
  <div className="flex p-0.5 bg-gray-100 rounded-lg w-full max-w-md">
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        disabled={disabled}
        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
          value === option.value
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChange(option.value)}
        aria-label={`${name}: ${option.label}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);