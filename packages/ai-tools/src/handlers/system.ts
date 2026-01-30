/**
 * @mango/ai-tools - System Tool Handlers
 *
 * Handlers for executing system-related AI tools.
 * These handlers provide system context and utility functions for AI assistants.
 *
 * Note: System tools are essential for AI to understand the operating context
 * and make appropriate decisions (e.g., not booking outside business hours).
 *
 * Usage:
 * - Import handlers for specific tool operations
 * - Pass validated input and ExecutionContext
 * - Returns ToolResult<T> with success/error
 */

import type {
  ExecutionContext,
  ToolResult,
  ToolHandler,
} from '../types';
import {
  successResult,
  errorResult,
} from '../types';
import type {
  GetStoreInfoInput,
  GetCurrentTimeInput,
  GetBusinessHoursInput,
  IsStoreOpenInput,
  GetSystemStatusInput,
  LogAIActionInput,
} from '../schemas/system';

// ============================================================================
// Data Provider Interface
// ============================================================================

/**
 * Interface for system data operations.
 * Implementations can use Supabase, IndexedDB, or any other data source.
 * This interface is injected at runtime to decouple handlers from data layer.
 */
export interface SystemDataProvider {
  /**
   * Get store information
   */
  getStoreInfo(params: {
    storeId: string;
    includeSettings: boolean;
    includeStaff: boolean;
    includeServices: boolean;
  }): Promise<StoreInfoResult>;

  /**
   * Get business hours
   */
  getBusinessHours(params: {
    storeId: string;
    date?: string;
    includeSpecialHours: boolean;
    daysAhead: number;
  }): Promise<BusinessHoursResult>;

  /**
   * Check if store is open
   */
  isStoreOpen(params: {
    storeId: string;
    date?: string;
    time?: string;
    includeNextChange: boolean;
  }): Promise<StoreOpenResult>;

  /**
   * Get system status
   */
  getSystemStatus(params: {
    storeId: string;
    includeFeatureFlags: boolean;
    includeIntegrations: boolean;
    includeAlerts: boolean;
  }): Promise<SystemStatusResult>;

  /**
   * Log an AI action
   */
  logAIAction(params: {
    storeId: string;
    userId: string;
    action: string;
    category: string;
    details?: Record<string, unknown>;
    reasoning?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    severity: string;
  }): Promise<LogActionResult>;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Day of week type
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * Store info result
 */
export interface StoreInfoResult {
  store: {
    id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    phone: string;
    email?: string;
    website?: string;
    timezone: string;
    currency: string;
    locale: string;
  };
  settings?: {
    minBookingNotice: number;
    maxBookingAhead: number;
    cancellationPolicy: string;
    cancellationDeadlineHours: number;
    allowOnlineBooking: boolean;
    allowWalkIns: boolean;
    requireDeposit: boolean;
    depositAmount?: number;
  };
  staff?: Array<{
    id: string;
    name: string;
    role: string;
    isAvailable: boolean;
  }>;
  services?: Array<{
    id: string;
    name: string;
    category: string;
    duration: number;
    price: number;
  }>;
}

/**
 * Current time result
 */
export interface CurrentTimeResult {
  iso?: string;
  human?: string;
  components?: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    dayOfWeek: DayOfWeek;
    isWeekend: boolean;
  };
  timezone?: {
    name: string;
    offset: string;
    abbreviation: string;
  };
}

/**
 * Business hours result
 */
export interface BusinessHoursResult {
  regularHours: Array<{
    day: DayOfWeek;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    breaks?: Array<{
      startTime: string;
      endTime: string;
      label?: string;
    }>;
  }>;
  specialHours?: Array<{
    date: string;
    name?: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    reason?: string;
  }>;
  timezone: string;
  dateRequested?: string;
  hoursForDate?: {
    date: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    isSpecialHours: boolean;
    specialReason?: string;
  };
}

/**
 * Store open result
 */
export interface StoreOpenResult {
  isOpen: boolean;
  checkedAt: {
    date: string;
    time: string;
    dayOfWeek: DayOfWeek;
  };
  todayHours?: {
    openTime: string;
    closeTime: string;
  };
  nextChange?: {
    type: 'opens' | 'closes';
    dateTime: string;
    timeUntil: string;
  };
  isSpecialHours: boolean;
  specialReason?: string;
}

/**
 * System status result
 */
export interface SystemStatusResult {
  status: 'operational' | 'degraded' | 'maintenance' | 'outage';
  timestamp: string;
  version?: string;
  features?: {
    onlineBooking: boolean;
    payments: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    offlineMode: boolean;
    aiAssistant: boolean;
  };
  integrations?: Array<{
    name: string;
    type: string;
    status: 'connected' | 'disconnected' | 'error';
    lastSync?: string;
  }>;
  alerts?: Array<{
    id: string;
    severity: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    createdAt: string;
    expiresAt?: string;
  }>;
}

/**
 * Log action result
 */
export interface LogActionResult {
  logged: boolean;
  logId: string;
  timestamp: string;
}

// ============================================================================
// Handler State
// ============================================================================

/**
 * Data provider instance (must be set before handlers can be used)
 */
let dataProvider: SystemDataProvider | null = null;

/**
 * Set the data provider for system handlers.
 * Must be called during app initialization before any handlers are invoked.
 *
 * @param provider - The data provider implementation
 */
export function setSystemDataProvider(provider: SystemDataProvider): void {
  dataProvider = provider;
}

/**
 * Get the current data provider.
 * Throws if not initialized.
 */
function getDataProvider(): SystemDataProvider {
  if (!dataProvider) {
    throw new Error(
      'System data provider not initialized. Call setSystemDataProvider() during app setup.'
    );
  }
  return dataProvider;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the day of week from a date
 */
function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}

/**
 * Format time for display
 */
function formatTimeForHumans(date: Date, timezone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  if (timezone) {
    options.timeZone = timezone;
  }
  return date.toLocaleString('en-US', options);
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle getStoreInfo tool invocation.
 *
 * Gets store information and optionally settings, staff, and services.
 */
export const handleGetStoreInfo: ToolHandler<
  GetStoreInfoInput,
  StoreInfoResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getStoreInfo', {
    includeSettings: input.includeSettings,
    includeStaff: input.includeStaff,
    includeServices: input.includeServices,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getStoreInfo({
      storeId: context.storeId,
      includeSettings: input.includeSettings,
      includeStaff: input.includeStaff,
      includeServices: input.includeServices,
    });

    context.logger.info('getStoreInfo completed', {
      storeName: result.store.name,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getStoreInfo failed', { error: errorMessage });

    // Check for permission denied on settings
    if (input.includeSettings &&
        errorMessage.toLowerCase().includes('permission')) {
      return errorResult(
        `Permission denied: Access to store settings requires higher privileges`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get store info: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getCurrentTime tool invocation.
 *
 * Gets the current date and time in the store's timezone.
 */
export const handleGetCurrentTime: ToolHandler<
  GetCurrentTimeInput,
  CurrentTimeResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getCurrentTime', {
    format: input.format,
    includeTimezone: input.includeTimezone,
  });

  try {
    // Get current time
    const now = new Date();
    const timezone = context.timezone ?? 'America/New_York';

    // Build result based on format
    const result: CurrentTimeResult = {};

    if (input.format === 'iso' || input.format === undefined) {
      result.iso = now.toISOString();
    }

    if (input.format === 'human') {
      result.human = formatTimeForHumans(now, timezone);
    }

    if (input.format === 'components') {
      // Get components in the store's timezone
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      };

      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
      const getPart = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

      const dayOfWeek = getDayOfWeek(now);
      const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';

      result.components = {
        year: getPart('year'),
        month: getPart('month'),
        day: getPart('day'),
        hour: getPart('hour'),
        minute: getPart('minute'),
        second: getPart('second'),
        dayOfWeek,
        isWeekend,
      };
    }

    if (input.includeTimezone) {
      // Get timezone info
      const tzOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        timeZoneName: 'short',
      };
      const tzFormatter = new Intl.DateTimeFormat('en-US', tzOptions);
      const tzParts = tzFormatter.formatToParts(now);
      const abbreviation = tzParts.find((p) => p.type === 'timeZoneName')?.value ?? '';

      // Calculate offset
      const offsetMinutes = now.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
      const offsetMins = Math.abs(offsetMinutes) % 60;
      const offsetSign = offsetMinutes <= 0 ? '+' : '-';
      const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

      result.timezone = {
        name: timezone,
        offset,
        abbreviation,
      };
    }

    context.logger.info('getCurrentTime completed', {
      format: input.format,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getCurrentTime failed', { error: errorMessage });

    return errorResult(
      `Failed to get current time: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getBusinessHours tool invocation.
 *
 * Gets the store's business hours including special hours.
 */
export const handleGetBusinessHours: ToolHandler<
  GetBusinessHoursInput,
  BusinessHoursResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getBusinessHours', {
    date: input.date,
    includeSpecialHours: input.includeSpecialHours,
    daysAhead: input.daysAhead,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getBusinessHours({
      storeId: context.storeId,
      date: input.date,
      includeSpecialHours: input.includeSpecialHours,
      daysAhead: input.daysAhead,
    });

    context.logger.info('getBusinessHours completed', {
      specialHoursCount: result.specialHours?.length ?? 0,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getBusinessHours failed', { error: errorMessage });

    return errorResult(
      `Failed to get business hours: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle isStoreOpen tool invocation.
 *
 * Checks if the store is open at a specific time.
 */
export const handleIsStoreOpen: ToolHandler<
  IsStoreOpenInput,
  StoreOpenResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing isStoreOpen', {
    date: input.date,
    time: input.time,
    includeNextChange: input.includeNextChange,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.isStoreOpen({
      storeId: context.storeId,
      date: input.date,
      time: input.time,
      includeNextChange: input.includeNextChange,
    });

    context.logger.info('isStoreOpen completed', {
      isOpen: result.isOpen,
      isSpecialHours: result.isSpecialHours,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('isStoreOpen failed', { error: errorMessage });

    return errorResult(
      `Failed to check if store is open: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getSystemStatus tool invocation.
 *
 * Gets system health status and capabilities.
 */
export const handleGetSystemStatus: ToolHandler<
  GetSystemStatusInput,
  SystemStatusResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getSystemStatus', {
    includeFeatureFlags: input.includeFeatureFlags,
    includeIntegrations: input.includeIntegrations,
    includeAlerts: input.includeAlerts,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getSystemStatus({
      storeId: context.storeId,
      includeFeatureFlags: input.includeFeatureFlags,
      includeIntegrations: input.includeIntegrations,
      includeAlerts: input.includeAlerts,
    });

    context.logger.info('getSystemStatus completed', {
      status: result.status,
      alertCount: result.alerts?.length ?? 0,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getSystemStatus failed', { error: errorMessage });

    return errorResult(
      `Failed to get system status: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle logAIAction tool invocation.
 *
 * Logs an AI action for auditing purposes.
 */
export const handleLogAIAction: ToolHandler<
  LogAIActionInput,
  LogActionResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing logAIAction', {
    action: input.action,
    category: input.category,
    severity: input.severity,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.logAIAction({
      storeId: context.storeId,
      userId: context.userId,
      action: input.action,
      category: input.category,
      details: input.details,
      reasoning: input.reasoning,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      severity: input.severity,
    });

    context.logger.info('logAIAction completed', {
      logId: result.logId,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('logAIAction failed', { error: errorMessage });

    // Even if logging fails, we shouldn't block the AI from operating
    // Return a partial success with the error noted
    return successResult(
      {
        logged: false,
        logId: '',
        timestamp: new Date().toISOString(),
      },
      {
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      }
    );
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All system tool handlers mapped by tool name.
 */
export const systemHandlers = {
  getStoreInfo: handleGetStoreInfo,
  getCurrentTime: handleGetCurrentTime,
  getBusinessHours: handleGetBusinessHours,
  isStoreOpen: handleIsStoreOpen,
  getSystemStatus: handleGetSystemStatus,
  logAIAction: handleLogAIAction,
};
