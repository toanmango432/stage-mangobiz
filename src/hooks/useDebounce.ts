/**
 * useDebounce Hook
 * Debounces a value with configurable delay
 */

import { useState, useEffect, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebounceCallback Hook
 * Debounces a callback function
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): [T, boolean] {
  const [isPending, setIsPending] = useState(false);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      setIsPending(true);
      const handler = setTimeout(() => {
        callback(...args);
        setIsPending(false);
      }, delay);

      return () => {
        clearTimeout(handler);
        setIsPending(false);
      };
    },
    [callback, delay]
  ) as T;

  return [debouncedCallback, isPending];
}
