import React from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import { ToggleSwitchProps } from '../types';

// Apple-style Toggle Switch Component
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false
}) => (
  <div className="group flex items-start justify-between py-2 w-full">
    <div className="flex flex-col pr-3">
      <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500 mt-0.5 max-w-[90%] leading-tight">
          {description}
        </span>
      )}
    </div>
    <div className="relative flex-shrink-0">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring focus-visible:ring-[#27AE60]/30 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${checked ? 'bg-[#27AE60]' : 'bg-gray-200'}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span
          className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          <span
            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
              checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
            }`}
            aria-hidden="true"
          >
            <Circle className="h-3 w-3 text-gray-400" />
          </span>
          <span
            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
              checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
            }`}
            aria-hidden="true"
          >
            <CheckCircle2 className="h-3 w-3 text-[#27AE60]" />
          </span>
        </span>
      </button>
    </div>
  </div>
);