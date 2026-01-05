/**
 * Sentry Error Tracking Configuration
 *
 * Provides production-grade error monitoring and performance tracking.
 * Initialize once at app startup before any other code runs.
 *
 * Setup:
 * 1. Create Sentry account at https://sentry.io
 * 2. Create a React project
 * 3. Copy DSN to .env as VITE_SENTRY_DSN
 */

import * as Sentry from '@sentry/react';

// ==================== CONFIGURATION ====================

interface SentryConfig {
  dsn: string | undefined;
  environment: string;
  release: string;
  enabled: boolean;
}

const config: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV || import.meta.env.MODE || 'development',
  release: `mango-pos@${import.meta.env.VITE_APP_VERSION || '0.1.0'}`,
  enabled: !!import.meta.env.VITE_SENTRY_DSN && import.meta.env.MODE === 'production',
};

// ==================== INITIALIZATION ====================

let isInitialized = false;

/**
 * Initialize Sentry error tracking
 * Call this once at app startup (in main.tsx)
 */
export function initSentry(): void {
  if (isInitialized) {
    console.warn('[Sentry] Already initialized');
    return;
  }

  if (!config.dsn) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      enabled: config.enabled,

      // Performance Monitoring
      tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0, // 10% in prod

      // Session Replay (optional - increases bundle size)
      // replaysSessionSampleRate: 0.01, // 1% of sessions
      // replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // Filter out known non-errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Ignore network errors (handled by circuit breaker)
        if (error instanceof Error) {
          if (error.message.includes('NetworkError') ||
              error.message.includes('Failed to fetch') ||
              error.message.includes('Load failed')) {
            return null;
          }
        }

        // Ignore cancelled requests
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }

        return event;
      },

      // Add context to all events
      initialScope: {
        tags: {
          app: 'mango-pos',
        },
      },
    });

    isInitialized = true;
    console.log(`[Sentry] Initialized for ${config.environment}`);
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

// ==================== USER CONTEXT ====================

/**
 * Set user context for error tracking
 * Call after successful login
 */
export function setUserContext(user: {
  id: string;
  storeId: string;
  storeName?: string;
  role?: string;
}): void {
  if (!isInitialized) return;

  Sentry.setUser({
    id: user.id,
  });

  Sentry.setTag('store_id', user.storeId);
  if (user.storeName) {
    Sentry.setTag('store_name', user.storeName);
  }
  if (user.role) {
    Sentry.setTag('user_role', user.role);
  }
}

/**
 * Clear user context on logout
 */
export function clearUserContext(): void {
  if (!isInitialized) return;
  Sentry.setUser(null);
}

// ==================== MANUAL ERROR CAPTURE ====================

/**
 * Capture an exception with optional context
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string | undefined {
  if (!isInitialized) {
    console.error('[Sentry] Not initialized, error:', error);
    return undefined;
  }

  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string | undefined {
  if (!isInitialized) {
    console.log(`[Sentry] Not initialized, message: ${message}`);
    return undefined;
  }

  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

// ==================== BREADCRUMBS ====================

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}): void {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

// ==================== PERFORMANCE ====================

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  if (!isInitialized) return undefined;

  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

// ==================== EXPORTS ====================

export { Sentry };

// Re-export ErrorBoundary for convenience
export const SentryErrorBoundary = Sentry.ErrorBoundary;
