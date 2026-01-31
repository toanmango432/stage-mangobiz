/**
 * @mango/ai-tools - System Tool Schemas
 *
 * Zod schemas for AI tools that provide system context and utility functions.
 * These tools allow AI assistants to get store information, check business hours,
 * and log their actions for auditing.
 *
 * Note: System tools are essential for AI to understand the operating context
 * and make appropriate decisions (e.g., not booking outside business hours).
 */

import { z } from 'zod';

// ============================================================================
// Common Schema Building Blocks
// ============================================================================

/**
 * Date string validation pattern (YYYY-MM-DD)
 */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date in YYYY-MM-DD format');

/**
 * Time string validation pattern (HH:MM)
 */
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .describe('Time in HH:MM 24-hour format');

/**
 * Day of week enum
 */
const dayOfWeekSchema = z
  .enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  .describe('Day of the week');

// ============================================================================
// Get Store Info Schema
// ============================================================================

/**
 * Get store information and settings.
 * Returns basic store details, contact info, and configuration.
 */
export const getStoreInfoSchema = z
  .object({
    includeSettings: z
      .boolean()
      .default(false)
      .describe('Include store settings like booking rules, cancellation policy (may require permission)'),
    includeStaff: z
      .boolean()
      .default(false)
      .describe('Include list of active staff members'),
    includeServices: z
      .boolean()
      .default(false)
      .describe('Include list of services offered'),
  })
  .describe(
    'Get basic store information including name, address, contact details, and optionally settings, staff list, and services. Use to understand the business context.'
  );

export type GetStoreInfoInput = z.infer<typeof getStoreInfoSchema>;

// ============================================================================
// Get Current Time Schema
// ============================================================================

/**
 * Get the current date and time in the store's timezone.
 * Essential for time-sensitive operations like booking.
 */
export const getCurrentTimeSchema = z
  .object({
    format: z
      .enum(['iso', 'human', 'components'])
      .default('iso')
      .describe(
        "Response format: 'iso' for ISO 8601 string, 'human' for natural language, 'components' for individual date/time parts"
      ),
    includeTimezone: z
      .boolean()
      .default(true)
      .describe('Include timezone information in response'),
  })
  .describe(
    "Get the current date and time in the store's timezone. Essential for time-sensitive operations like checking availability, booking appointments, or understanding when the store is open."
  );

export type GetCurrentTimeInput = z.infer<typeof getCurrentTimeSchema>;

// ============================================================================
// Get Business Hours Schema
// ============================================================================

/**
 * Get the store's business hours.
 * Shows operating hours for each day of the week.
 */
export const getBusinessHoursSchema = z
  .object({
    date: dateSchema
      .optional()
      .describe('Get hours for a specific date (accounts for holidays/special hours). Defaults to showing weekly schedule.'),
    includeSpecialHours: z
      .boolean()
      .default(true)
      .describe('Include upcoming special hours (holidays, events) in the response'),
    daysAhead: z
      .number()
      .int()
      .min(0)
      .max(90)
      .default(14)
      .describe('How many days ahead to check for special hours (0-90, default 14)'),
  })
  .describe(
    "Get the store's business hours including regular weekly schedule and any special hours for holidays or events. Use before booking to ensure appointments fall within operating hours."
  );

export type GetBusinessHoursInput = z.infer<typeof getBusinessHoursSchema>;

// ============================================================================
// Is Store Open Schema
// ============================================================================

/**
 * Check if the store is currently open or will be open at a specific time.
 * Returns boolean and additional context.
 */
export const isStoreOpenSchema = z
  .object({
    date: dateSchema
      .optional()
      .describe('Date to check (YYYY-MM-DD). Defaults to today.'),
    time: timeSchema
      .optional()
      .describe('Time to check (HH:MM in 24hr format). Defaults to current time.'),
    includeNextChange: z
      .boolean()
      .default(true)
      .describe('Include when the store opens/closes next'),
  })
  .describe(
    'Check if the store is currently open or will be open at a specific date/time. Use to quickly validate if operations are possible at a given time.'
  );

export type IsStoreOpenInput = z.infer<typeof isStoreOpenSchema>;

// ============================================================================
// Get System Status Schema
// ============================================================================

/**
 * Get system health status and capabilities.
 * Shows what features are available and any active alerts.
 */
export const getSystemStatusSchema = z
  .object({
    includeFeatureFlags: z
      .boolean()
      .default(false)
      .describe('Include list of enabled/disabled feature flags'),
    includeIntegrations: z
      .boolean()
      .default(false)
      .describe('Include status of third-party integrations (payment processor, SMS, etc.)'),
    includeAlerts: z
      .boolean()
      .default(true)
      .describe('Include any active system alerts or maintenance notices'),
  })
  .describe(
    'Get system health status including what features are available and any active alerts. Use to understand system capabilities before attempting operations.'
  );

export type GetSystemStatusInput = z.infer<typeof getSystemStatusSchema>;

// ============================================================================
// Log AI Action Schema
// ============================================================================

/**
 * Log an AI action for auditing purposes.
 * Used to record significant decisions or actions taken by AI.
 */
export const logAIActionSchema = z
  .object({
    action: z
      .string()
      .min(1)
      .max(100)
      .describe('Brief description of the action taken (e.g., "booked_appointment", "updated_client")'),
    category: z
      .enum(['booking', 'client', 'ticket', 'staff', 'system', 'recommendation', 'other'])
      .describe('Category of the action for grouping in audit logs'),
    details: z
      .record(z.unknown())
      .optional()
      .describe('Additional structured details about the action (JSON object)'),
    reasoning: z
      .string()
      .max(500)
      .optional()
      .describe("AI's reasoning for why this action was taken (for audit/debugging)"),
    relatedEntityType: z
      .enum(['client', 'appointment', 'ticket', 'staff', 'service', 'product'])
      .optional()
      .describe('Type of the primary entity this action relates to'),
    relatedEntityId: z
      .string()
      .uuid()
      .optional()
      .describe('ID of the primary entity this action relates to'),
    severity: z
      .enum(['info', 'warning', 'important'])
      .default('info')
      .describe("Importance level: 'info' for routine actions, 'warning' for unusual actions, 'important' for significant changes"),
  })
  .describe(
    "Log an AI action for auditing and debugging purposes. Use to record significant decisions, recommendations made, or actions taken. Helps track AI behavior and diagnose issues."
  );

export type LogAIActionInput = z.infer<typeof logAIActionSchema>;

// ============================================================================
// Tool Definitions
// ============================================================================

import type { AITool } from '../types';

/**
 * Get store info tool definition
 */
export const getStoreInfoTool: AITool<typeof getStoreInfoSchema> = {
  name: 'getStoreInfo',
  description:
    'Get store information including name, address, contact details, and optionally booking settings, staff list, and services offered. Use to understand the business context.',
  category: 'system',
  parameters: getStoreInfoSchema,
  returns: z.object({
    store: z.object({
      id: z.string(),
      name: z.string(),
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string(),
      }),
      phone: z.string(),
      email: z.string().optional(),
      website: z.string().optional(),
      timezone: z.string(),
      currency: z.string(),
      locale: z.string(),
    }),
    settings: z
      .object({
        minBookingNotice: z.number().describe('Minimum hours notice required for booking'),
        maxBookingAhead: z.number().describe('Maximum days ahead bookings are accepted'),
        cancellationPolicy: z.string(),
        cancellationDeadlineHours: z.number(),
        allowOnlineBooking: z.boolean(),
        allowWalkIns: z.boolean(),
        requireDeposit: z.boolean(),
        depositAmount: z.number().optional(),
      })
      .optional(),
    staff: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          role: z.string(),
          isAvailable: z.boolean(),
        })
      )
      .optional(),
    services: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          category: z.string(),
          duration: z.number(),
          price: z.number(),
        })
      )
      .optional(),
  }),
  tags: ['read', 'system', 'context'],
};

/**
 * Get current time tool definition
 */
export const getCurrentTimeTool: AITool<typeof getCurrentTimeSchema> = {
  name: 'getCurrentTime',
  description:
    "Get the current date and time in the store's timezone. Essential for time-sensitive operations like availability checking and booking validation.",
  category: 'system',
  parameters: getCurrentTimeSchema,
  returns: z.object({
    iso: z.string().optional().describe('ISO 8601 formatted datetime'),
    human: z.string().optional().describe('Human-readable date and time'),
    components: z
      .object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
        hour: z.number(),
        minute: z.number(),
        second: z.number(),
        dayOfWeek: dayOfWeekSchema,
        isWeekend: z.boolean(),
      })
      .optional(),
    timezone: z
      .object({
        name: z.string(),
        offset: z.string(),
        abbreviation: z.string(),
      })
      .optional(),
  }),
  tags: ['read', 'system', 'time'],
};

/**
 * Get business hours tool definition
 */
export const getBusinessHoursTool: AITool<typeof getBusinessHoursSchema> = {
  name: 'getBusinessHours',
  description:
    "Get the store's business hours including regular weekly schedule and special hours for holidays or events. Use before booking to validate appointment times.",
  category: 'system',
  parameters: getBusinessHoursSchema,
  returns: z.object({
    regularHours: z.array(
      z.object({
        day: dayOfWeekSchema,
        isOpen: z.boolean(),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        breaks: z
          .array(
            z.object({
              startTime: z.string(),
              endTime: z.string(),
              label: z.string().optional(),
            })
          )
          .optional(),
      })
    ),
    specialHours: z
      .array(
        z.object({
          date: z.string(),
          name: z.string().optional(),
          isOpen: z.boolean(),
          openTime: z.string().optional(),
          closeTime: z.string().optional(),
          reason: z.string().optional(),
        })
      )
      .optional(),
    timezone: z.string(),
    dateRequested: z.string().optional(),
    hoursForDate: z
      .object({
        date: z.string(),
        isOpen: z.boolean(),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        isSpecialHours: z.boolean(),
        specialReason: z.string().optional(),
      })
      .optional(),
  }),
  tags: ['read', 'system', 'hours'],
};

/**
 * Is store open tool definition
 */
export const isStoreOpenTool: AITool<typeof isStoreOpenSchema> = {
  name: 'isStoreOpen',
  description:
    'Check if the store is currently open or will be open at a specific time. Returns boolean result with context about next opening/closing.',
  category: 'system',
  parameters: isStoreOpenSchema,
  returns: z.object({
    isOpen: z.boolean(),
    checkedAt: z.object({
      date: z.string(),
      time: z.string(),
      dayOfWeek: dayOfWeekSchema,
    }),
    todayHours: z
      .object({
        openTime: z.string(),
        closeTime: z.string(),
      })
      .optional(),
    nextChange: z
      .object({
        type: z.enum(['opens', 'closes']),
        dateTime: z.string(),
        timeUntil: z.string(),
      })
      .optional(),
    isSpecialHours: z.boolean(),
    specialReason: z.string().optional(),
  }),
  tags: ['read', 'system', 'hours'],
};

/**
 * Get system status tool definition
 */
export const getSystemStatusTool: AITool<typeof getSystemStatusSchema> = {
  name: 'getSystemStatus',
  description:
    'Get system health status including available features, integration status, and active alerts. Use to understand what capabilities are available.',
  category: 'system',
  parameters: getSystemStatusSchema,
  returns: z.object({
    status: z.enum(['operational', 'degraded', 'maintenance', 'outage']),
    timestamp: z.string(),
    version: z.string().optional(),
    features: z
      .object({
        onlineBooking: z.boolean(),
        payments: z.boolean(),
        smsNotifications: z.boolean(),
        emailNotifications: z.boolean(),
        offlineMode: z.boolean(),
        aiAssistant: z.boolean(),
      })
      .optional(),
    integrations: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          status: z.enum(['connected', 'disconnected', 'error']),
          lastSync: z.string().optional(),
        })
      )
      .optional(),
    alerts: z
      .array(
        z.object({
          id: z.string(),
          severity: z.enum(['info', 'warning', 'error']),
          title: z.string(),
          message: z.string(),
          createdAt: z.string(),
          expiresAt: z.string().optional(),
        })
      )
      .optional(),
  }),
  tags: ['read', 'system', 'health'],
};

/**
 * Log AI action tool definition
 */
export const logAIActionTool: AITool<typeof logAIActionSchema> = {
  name: 'logAIAction',
  description:
    'Log an AI action for auditing and debugging purposes. Use to record significant decisions, recommendations, or actions taken by the AI assistant.',
  category: 'system',
  parameters: logAIActionSchema,
  returns: z.object({
    logged: z.boolean(),
    logId: z.string(),
    timestamp: z.string(),
  }),
  tags: ['write', 'system', 'audit'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All system tool schemas
 */
export const systemSchemas = {
  getStoreInfo: getStoreInfoSchema,
  getCurrentTime: getCurrentTimeSchema,
  getBusinessHours: getBusinessHoursSchema,
  isStoreOpen: isStoreOpenSchema,
  getSystemStatus: getSystemStatusSchema,
  logAIAction: logAIActionSchema,
};

/**
 * All system tool definitions
 */
export const systemTools = [
  getStoreInfoTool,
  getCurrentTimeTool,
  getBusinessHoursTool,
  isStoreOpenTool,
  getSystemStatusTool,
  logAIActionTool,
];
