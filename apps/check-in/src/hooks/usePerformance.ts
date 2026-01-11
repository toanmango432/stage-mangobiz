import { useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  componentName: string;
  mountTime: number;
  renderCount: number;
}

/**
 * Hook for monitoring component performance in development
 * Reports mount time and render count to help identify performance issues
 */
export function usePerformance(componentName: string): void {
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  useEffect(() => {
    renderCountRef.current += 1;
  });

  useEffect(() => {
    const startTime = performance.now();
    mountTimeRef.current = startTime;

    return () => {
      if (import.meta.env.DEV) {
        const totalTime = performance.now() - mountTimeRef.current;
        console.debug(`[Performance] ${componentName}:`, {
          mountTime: `${mountTimeRef.current.toFixed(2)}ms`,
          totalLifetime: `${totalTime.toFixed(2)}ms`,
          renderCount: renderCountRef.current,
        });
      }
    };
  }, [componentName]);
}

/**
 * Utility to measure async operation performance
 */
export async function measureAsync<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    if (import.meta.env.DEV) {
      const duration = performance.now() - startTime;
      console.debug(`[Performance] ${operationName}: ${duration.toFixed(2)}ms`);
    }
    return result;
  } catch (error) {
    if (import.meta.env.DEV) {
      const duration = performance.now() - startTime;
      console.debug(`[Performance] ${operationName} FAILED after ${duration.toFixed(2)}ms`);
    }
    throw error;
  }
}

/**
 * Web Vitals monitoring hook
 * Reports Core Web Vitals (LCP, FID, CLS) to console in development
 */
export function useWebVitals(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !import.meta.env.DEV) return;

    // Report navigation timing
    const reportNavigationTiming = () => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (timing) {
        console.debug('[Web Vitals] Navigation:', {
          domContentLoaded: `${timing.domContentLoadedEventEnd.toFixed(2)}ms`,
          loadComplete: `${timing.loadEventEnd.toFixed(2)}ms`,
          domInteractive: `${timing.domInteractive.toFixed(2)}ms`,
        });
      }
    };

    // Delay to ensure navigation timing is complete
    const timeoutId = setTimeout(reportNavigationTiming, 1000);

    return () => clearTimeout(timeoutId);
  }, []);
}
