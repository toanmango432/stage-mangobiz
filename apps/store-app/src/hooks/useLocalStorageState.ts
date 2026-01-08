/**
 * useLocalStorageState Hook
 * PERFORMANCE FIX: Non-blocking localStorage reads
 *
 * Problem: Components using useState(() => localStorage.getItem(...)) block render
 * Solution: Read localStorage AFTER mount in useEffect (non-blocking)
 *
 * Usage:
 * // Before (SLOW - blocks render)
 * const [value, setValue] = useState(() => localStorage.getItem('key') || 'default');
 *
 * // After (FAST - non-blocking)
 * const [value, setValue] = useLocalStorageState({ key: 'key', defaultValue: 'default' });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLocalStorageStateOptions<T> {
  /** LocalStorage key */
  key: string;
  /** Default value to use before localStorage is read */
  defaultValue: T;
  /** Custom parser for complex values (default: JSON.parse) */
  parser?: (value: string | null) => T;
  /** Custom serializer for complex values (default: JSON.stringify) */
  serializer?: (value: T) => string;
}

/**
 * useState backed by localStorage with non-blocking reads
 *
 * @example
 * // Simple string/number
 * const [scale, setScale] = useLocalStorageState({
 *   key: 'cardScale',
 *   defaultValue: 1.0,
 *   parser: (v) => v ? parseFloat(v) : 1.0,
 *   serializer: String,
 * });
 *
 * @example
 * // Complex object
 * const [settings, setSettings] = useLocalStorageState({
 *   key: 'teamSettings',
 *   defaultValue: { showOffStaff: true, columns: 4 },
 * });
 */
export function useLocalStorageState<T>({
  key,
  defaultValue,
  parser,
  serializer = JSON.stringify,
}: UseLocalStorageStateOptions<T>): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  // Start with default value (non-blocking)
  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialized = useRef(false);

  // Read from localStorage AFTER mount (non-blocking)
  useEffect(() => {
    if (!isInitialized.current) {
      try {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          const parsed = parser ? parser(saved) : JSON.parse(saved);
          setState(parsed);
        }
      } catch (e) {
        console.warn(`[useLocalStorageState] Failed to read "${key}":`, e);
      }
      isInitialized.current = true;
      setIsLoaded(true);
    }
  }, [key, parser]);

  // Setter that also persists to localStorage
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const nextValue = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;

      // Persist to localStorage
      try {
        localStorage.setItem(key, serializer(nextValue));
      } catch (e) {
        console.warn(`[useLocalStorageState] Failed to write "${key}":`, e);
      }

      return nextValue;
    });
  }, [key, serializer]);

  return [state, setValue, isLoaded];
}

/**
 * Convenience hook for simple string values
 */
export function useLocalStorageString(
  key: string,
  defaultValue: string = ''
): [string, (value: string | ((prev: string) => string)) => void] {
  const [value, setValue] = useLocalStorageState({
    key,
    defaultValue,
    parser: (v) => v ?? defaultValue,
    serializer: (v) => v,
  });
  return [value, setValue];
}

/**
 * Convenience hook for number values
 */
export function useLocalStorageNumber(
  key: string,
  defaultValue: number = 0
): [number, (value: number | ((prev: number) => number)) => void] {
  const [value, setValue] = useLocalStorageState({
    key,
    defaultValue,
    parser: (v) => v ? parseFloat(v) : defaultValue,
    serializer: String,
  });
  return [value, setValue];
}

/**
 * Convenience hook for boolean values
 */
export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean = false
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
  const [value, setValue] = useLocalStorageState({
    key,
    defaultValue,
    parser: (v) => v === 'true',
    serializer: String,
  });
  return [value, setValue];
}

export default useLocalStorageState;
