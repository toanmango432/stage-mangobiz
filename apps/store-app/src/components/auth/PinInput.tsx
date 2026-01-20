/**
 * PinInput Component
 *
 * A reusable PIN input component with visual dot indicators.
 * Supports 4-6 digit PINs with proper masking and keyboard handling.
 *
 * Features:
 * - Hidden input for actual value capture
 * - Visual dots showing filled/empty positions
 * - Numeric-only keyboard on mobile devices
 * - Backspace handling for deletion
 * - Error state with red border
 * - Auto-focus support
 *
 * @example
 * ```tsx
 * const [pin, setPin] = useState('');
 * <PinInput
 *   value={pin}
 *   onChange={setPin}
 *   length={4}
 *   autoFocus
 *   error={!!errorMessage}
 * />
 * ```
 */

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface PinInputProps {
  /** Current PIN value */
  value: string;
  /** Callback when PIN value changes */
  onChange: (value: string) => void;
  /** Number of PIN digits (default: 4) */
  length?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show error state (red border) */
  error?: boolean;
  /** Whether to auto-focus on mount */
  autoFocus?: boolean;
  /** Additional class name for the container */
  className?: string;
  /** Callback when user presses Enter with complete PIN */
  onComplete?: (value: string) => void;
}

/**
 * Reusable PIN input component with visual dot indicators.
 *
 * Uses a hidden input for actual value capture and renders visual
 * circles that fill as the user types. Supports 4-6 digit PINs.
 */
export function PinInput({
  value,
  onChange,
  length = 4,
  disabled = false,
  error = false,
  autoFocus = false,
  className,
  onComplete,
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Clamp length to valid range (4-6)
  const pinLength = Math.min(Math.max(length, 4), 6);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure modal animations complete
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Only allow digits
      const digitsOnly = newValue.replace(/\D/g, '');

      // Limit to max length
      const trimmed = digitsOnly.slice(0, pinLength);

      onChange(trimmed);

      // Call onComplete when PIN is fully entered
      if (trimmed.length === pinLength && onComplete) {
        onComplete(trimmed);
      }
    },
    [onChange, onComplete, pinLength]
  );

  // Handle keydown for special keys
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
      if (allowedKeys.includes(e.key)) {
        if (e.key === 'Enter' && value.length === pinLength && onComplete) {
          onComplete(value);
        }
        return;
      }

      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (
        (e.ctrlKey || e.metaKey) &&
        ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
      ) {
        return;
      }

      // Block non-numeric keys
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    },
    [value, pinLength, onComplete]
  );

  // Handle paste
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      const digitsOnly = pastedData.replace(/\D/g, '').slice(0, pinLength);

      if (digitsOnly) {
        onChange(digitsOnly);

        // Call onComplete if fully pasted
        if (digitsOnly.length === pinLength && onComplete) {
          onComplete(digitsOnly);
        }
      }
    },
    [onChange, onComplete, pinLength]
  );

  // Focus input when clicking on the dot container
  const handleContainerClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Generate array of digit positions
  const positions = Array.from({ length: pinLength }, (_, i) => i);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Hidden input for actual value capture */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        maxLength={pinLength}
        className="sr-only"
        aria-label="PIN input"
      />

      {/* Visual dots container */}
      <div
        className={cn(
          'flex items-center justify-center gap-3 p-4 rounded-xl cursor-text transition-all',
          'border-2',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-200 bg-gray-50 focus-within:border-purple-500 focus-within:bg-purple-50/30'
        )}
        onClick={handleContainerClick}
        role="presentation"
      >
        {positions.map((index) => {
          const isFilled = index < value.length;
          const isCurrentPosition = index === value.length;

          return (
            <div
              key={index}
              className={cn(
                'w-4 h-4 rounded-full transition-all duration-200',
                isFilled
                  ? error
                    ? 'bg-red-500'
                    : 'bg-purple-600 scale-100'
                  : error
                    ? 'border-2 border-red-300'
                    : 'border-2 border-gray-300',
                // Subtle pulse animation on current position when focused
                isCurrentPosition && !disabled && 'animate-pulse'
              )}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* Screen reader feedback */}
      <span className="sr-only" aria-live="polite">
        {value.length} of {pinLength} digits entered
      </span>
    </div>
  );
}

export default PinInput;
