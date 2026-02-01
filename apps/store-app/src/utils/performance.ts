/**
 * Performance Utilities
 * Helpers for optimizing React component performance
 * Phase 8: Performance Optimization for Book Module
 */

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';

// ============================================================================
// MEMOIZATION HELPERS
// ============================================================================

/**
 * Deep comparison for memo
 * Use with React.memo for complex objects
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return false;

  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Shallow comparison for appointment cards
 * Only compares relevant fields for re-render decision
 */
export function appointmentPropsEqual(
  prev: { appointment: { id: string; status: string; syncStatus?: string } },
  next: { appointment: { id: string; status: string; syncStatus?: string } }
): boolean {
  return (
    prev.appointment.id === next.appointment.id &&
    prev.appointment.status === next.appointment.status &&
    prev.appointment.syncStatus === next.appointment.syncStatus
  );
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounce hook - delays execution until after wait milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
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
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttle hook - limits execution to once per wait milliseconds
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastRan.current);

      if (remaining <= 0) {
        lastRan.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastRan.current = Date.now();
          timeoutRef.current = null;
          callback(...args);
        }, remaining);
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// ============================================================================
// VIRTUAL LIST HELPERS
// ============================================================================

/**
 * Calculate visible items for virtualization
 */
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  itemCount: number,
  overscan = 3
): { startIndex: number; endIndex: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + overscan * 2);

  return { startIndex, endIndex };
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const { startIndex, endIndex } = useMemo(
    () => getVisibleRange(scrollTop, containerHeight, itemHeight, itemCount),
    [scrollTop, containerHeight, itemHeight, itemCount]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    handleScroll,
    totalHeight,
    offsetY,
    visibleItems: endIndex - startIndex + 1,
  };
}

// ============================================================================
// GPU ACCELERATION HELPERS
// ============================================================================

/**
 * CSS properties that trigger GPU acceleration
 * Use transform and opacity for smooth 60fps animations
 */
export const gpuAcceleratedStyles = {
  /** Force GPU layer creation */
  forceGpu: {
    transform: 'translateZ(0)',
    willChange: 'transform',
  } as const,

  /** Fade animation (GPU accelerated) */
  fade: (opacity: number) => ({
    opacity,
    willChange: 'opacity',
  }),

  /** Slide animation (GPU accelerated) */
  slide: (x: number, y = 0) => ({
    transform: `translate3d(${x}px, ${y}px, 0)`,
    willChange: 'transform',
  }),

  /** Scale animation (GPU accelerated) */
  scale: (value: number) => ({
    transform: `scale3d(${value}, ${value}, 1)`,
    willChange: 'transform',
  }),

  /** Combined transform (GPU accelerated) */
  transform: (translate: { x?: number; y?: number }, scale?: number, rotate?: number) => {
    const parts: string[] = [];

    if (translate.x !== undefined || translate.y !== undefined) {
      parts.push(`translate3d(${translate.x || 0}px, ${translate.y || 0}px, 0)`);
    }
    if (scale !== undefined) {
      parts.push(`scale3d(${scale}, ${scale}, 1)`);
    }
    if (rotate !== undefined) {
      parts.push(`rotate(${rotate}deg)`);
    }

    return {
      transform: parts.join(' ') || 'none',
      willChange: 'transform',
    };
  },
};

/**
 * Remove will-change after animation completes
 * This is important for memory optimization
 */
export function useWillChange(
  ref: React.RefObject<HTMLElement>,
  properties: string,
  duration = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = useCallback(() => {
    if (ref.current) {
      ref.current.style.willChange = properties;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (ref.current) {
        ref.current.style.willChange = 'auto';
      }
    }, duration);
  }, [ref, properties, duration]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return startAnimation;
}

// ============================================================================
// LAZY LOADING HELPERS
// ============================================================================

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Preload component on hover
 */
export function usePreload(
  loadFn: () => Promise<unknown>,
  delay = 100
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedRef = useRef(false);

  const onMouseEnter = useCallback(() => {
    if (loadedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      loadFn().then(() => {
        loadedRef.current = true;
      });
    }, delay);
  }, [loadFn, delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

// ============================================================================
// RENDER OPTIMIZATION
// ============================================================================

/**
 * Track re-renders in development
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);
  renderCount.current += 1;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Render] ${componentName}: ${renderCount.current}`);
  }

  // eslint-disable-next-line react-hooks/refs
  return renderCount.current;
}

/**
 * Check if props changed (for debugging)
 */
export function useWhyDidYouUpdate<T extends Record<string, unknown>>(
  name: string,
  props: T
) {
  const previousProps = useRef<T>(undefined as unknown as T);

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changesObj: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', name, changesObj);
      }
    }

    previousProps.current = props;
  });
}

// ============================================================================
// BATCH UPDATES
// ============================================================================

/**
 * Batch multiple state updates
 * In React 18+, this is automatic, but useful for React 17
 */
export function batchUpdates(callback: () => void): void {
  // React 18+ automatically batches, but we keep this for compatibility
  // and explicit intent
  callback();
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Measure component render time
 */
export function measureRender(componentName: string): () => void {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    if (duration > 16) {
      // More than 16ms means we missed a frame
      console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
    }
  };
}

/**
 * Performance mark for profiling
 */
export function perfMark(name: string): void {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(name);
  }
}

/**
 * Performance measure between two marks
 */
export function perfMeasure(name: string, startMark: string, endMark: string): void {
  if (process.env.NODE_ENV === 'development') {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      if (entries.length > 0) {
        console.log(`[Performance] ${name}: ${entries[0].duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Marks might not exist
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  deepEqual,
  appointmentPropsEqual,
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  getVisibleRange,
  useVirtualScroll,
  gpuAcceleratedStyles,
  useWillChange,
  useIntersectionObserver,
  usePreload,
  useRenderCount,
  useWhyDidYouUpdate,
  batchUpdates,
  measureRender,
  perfMark,
  perfMeasure,
};
