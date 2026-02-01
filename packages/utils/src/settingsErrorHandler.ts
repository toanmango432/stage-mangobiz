/**
 * Settings Error Handler
 *
 * ISSUE-003: Centralized error handling for FrontDesk settings.
 * Provides consistent error logging and user-facing toast notifications.
 */

// Toast interface for dependency injection
interface ToastFunction {
  error: (message: string, options?: { duration?: number; position?: string }) => void;
}

// Module-level toast instance (set via setToast)
let toast: ToastFunction | null = null;

/**
 * Set the toast instance for user notifications.
 * Must be called before using handleSettingsError if you want toast notifications.
 * If not set, errors are only logged to console.
 */
export function setToast(toastInstance: ToastFunction): void {
  toast = toastInstance;
}

export type SettingsErrorType = 'load' | 'save' | 'migration' | 'validation' | 'sync';

/**
 * Handle settings-related errors with consistent logging and user feedback.
 *
 * @param type - The type of error (load, save, migration, validation, sync)
 * @param error - The error object or message
 * @param context - Optional additional context for debugging
 */
export function handleSettingsError(
  type: SettingsErrorType,
  error: unknown,
  context?: string
): void {
  const message = error instanceof Error ? error.message : String(error);
  const fullContext = context ? ` [${context}]` : '';

  // Log to console for debugging
  console.error(`[Settings ${type}]${fullContext}:`, message);

  // User-facing messages - friendly and actionable
  const userMessages: Record<SettingsErrorType, string> = {
    load: 'Failed to load settings. Using defaults.',
    save: 'Failed to save settings. Please try again.',
    migration: 'Settings migration failed. Some settings may be reset.',
    validation: 'Invalid settings detected. Using defaults.',
    sync: 'Settings sync failed. Changes may not be saved across tabs.',
  };

  // Show toast notification to user (if toast is configured)
  if (toast) {
    toast.error(userMessages[type], {
      duration: 4000,
      position: 'bottom-right',
    });
  }
}

/**
 * Safely parse JSON with error handling.
 * Returns null on parse failure instead of throwing.
 *
 * @param jsonString - The JSON string to parse
 * @param context - Optional context for error logging
 */
export function safeParseJSON<T>(jsonString: string, context?: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    handleSettingsError('validation', error, context || 'JSON parse');
    return null;
  }
}

/**
 * Wrap an async operation with settings error handling.
 *
 * @param operation - The async operation to wrap
 * @param errorType - The type of error to report on failure
 * @param context - Optional context for error logging
 * @returns The result of the operation, or undefined on failure
 */
export async function withSettingsErrorHandling<T>(
  operation: () => Promise<T>,
  errorType: SettingsErrorType,
  context?: string
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleSettingsError(errorType, error, context);
    return undefined;
  }
}
