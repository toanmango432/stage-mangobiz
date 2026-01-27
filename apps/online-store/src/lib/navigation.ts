'use client';

/**
 * Navigation compatibility layer for migrating from react-router-dom to Next.js.
 *
 * TRANSITIONAL: This module will be removed in US-044 after all components
 * are migrated to use next/link and next/navigation directly.
 */

// Re-export Next.js navigation primitives
export { default as Link } from 'next/link';
export {
  usePathname,
  useSearchParams,
  useParams,
  useRouter as useAppRouter,
} from 'next/navigation';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

const NAV_STATE_KEY = '__nav_state__';

/**
 * Store navigation state in sessionStorage for cross-page transfer.
 * Next.js router.push doesn't support passing state like react-router-dom.
 */
function setNavigationState(state: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable or quota exceeded
  }
}

/**
 * Retrieve and clear navigation state from sessionStorage.
 * Call this in the destination page to read state passed via useNavigate().
 */
export function getNavigationState<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(NAV_STATE_KEY);
    if (raw) {
      sessionStorage.removeItem(NAV_STATE_KEY);
      return JSON.parse(raw) as T;
    }
  } catch {
    // parse error or storage unavailable
  }
  return null;
}

interface NavigateOptions {
  state?: unknown;
  replace?: boolean;
}

type NavigateFunction = {
  (to: string, options?: NavigateOptions): void;
  (delta: number): void;
};

/**
 * Drop-in replacement for react-router-dom's useNavigate().
 *
 * Supports:
 *  - navigate('/path')
 *  - navigate('/path', { replace: true })
 *  - navigate('/path', { state: { ... } })
 *  - navigate(-1) (go back)
 *
 * State is transferred via sessionStorage since Next.js router.push
 * doesn't support a state parameter. Use getNavigationState() in
 * the destination page to retrieve it.
 */
export function useNavigate(): NavigateFunction {
  const router = useRouter();

  return useCallback(
    (toOrDelta: string | number, options?: NavigateOptions) => {
      if (typeof toOrDelta === 'number') {
        if (toOrDelta < 0) {
          router.back();
        }
        return;
      }

      if (options?.state) {
        setNavigationState(options.state);
      }

      if (options?.replace) {
        router.replace(toOrDelta);
      } else {
        router.push(toOrDelta);
      }
    },
    [router],
  ) as NavigateFunction;
}
