/**
 * @mango/ai-tools - Staff Tool Schemas
 *
 * Zod schemas for AI tools that query staff schedules, availability, and performance.
 * These tools allow AI assistants to find available staff, check schedules, and get performance metrics.
 *
 * Note: Staff data can be sensitive. Some fields (like performance metrics, commission rates)
 * may be restricted based on the requesting user's permissions.
 */

import { z } from 'zod';

// ============================================================================
// Common Schema Building Blocks
// ============================================================================

/**
 * UUID string validation pattern
 */
const uuidSchema = z
  .string()
  .uuid()
  .describe('Unique identifier in UUID format');

/**
 * Date string validation pattern (YYYY-MM-DD)
 */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date in YYYY-MM-DD format');

/**
 * Time range for analytics/performance queries
 */
const timeRangeSchema = z
  .enum(['week', 'month', 'quarter'])
  .describe('Time range: week (7 days), month (30 days), quarter (90 days)');

/**
 * Staff role enum
 */
const staffRoleSchema = z
  .enum([
    'stylist',
    'colorist',
    'nail_tech',
    'esthetician',
    'massage_therapist',
    'barber',
    'receptionist',
    'manager',
    'assistant',
    'apprentice',
    'owner',
    'other',
  ])
  .describe(
    'Staff role/position. Common salon roles include stylist, colorist, nail_tech, esthetician, massage_therapist.'
  );

/**
 * Staff status enum
 */
const staffStatusSchema = z
  .enum(['available', 'busy', 'on_break', 'off_duty', 'checked_out'])
  .describe('Current working status of a staff member');

// ============================================================================
// Search Staff Schema
// ============================================================================

/**
 * Search for staff members by name, role, or availability.
 * Returns a list of matching staff with basic information.
 */
export const searchStaffSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Search term to match against staff name or nickname. Leave empty to list all staff.'
      ),
    role: staffRoleSchema
      .optional()
      .describe('Filter by staff role/position'),
    available: z
      .boolean()
      .optional()
      .describe('Filter to only staff currently available (not busy, on break, or off duty)'),
    canPerformServiceId: z
      .string()
      .uuid()
      .optional()
      .describe('Filter to staff qualified to perform a specific service'),
    includeInactive: z
      .boolean()
      .default(false)
      .describe('Include inactive/terminated staff members (default false)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Maximum number of staff to return (1-100, default 20)'),
    offset: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Number of staff to skip for pagination (default 0)'),
  })
  .describe(
    'Search for staff members by name, role, or current availability. Use to find who can help a client or who is available for booking.'
  );

export type SearchStaffInput = z.infer<typeof searchStaffSchema>;

// ============================================================================
// Get Staff Schema
// ============================================================================

/**
 * Get detailed information about a specific staff member.
 * Returns profile, skills, schedule summary, and optionally performance metrics.
 */
export const getStaffSchema = z
  .object({
    staffId: uuidSchema.describe('The unique identifier of the staff member to retrieve'),
    includePerformance: z
      .boolean()
      .default(false)
      .describe('Include recent performance metrics (requires manager permission)'),
    includeSchedule: z
      .boolean()
      .default(false)
      .describe('Include upcoming schedule for the next 7 days'),
  })
  .describe(
    'Retrieve complete details for a specific staff member including profile, skills, services they perform, and optionally their schedule and performance.'
  );

export type GetStaffInput = z.infer<typeof getStaffSchema>;

// ============================================================================
// Get Staff Schedule Schema
// ============================================================================

/**
 * Get a staff member's schedule for a date range.
 * Shows working hours, breaks, appointments, and time off.
 */
export const getStaffScheduleSchema = z
  .object({
    staffId: uuidSchema.describe('The staff member to get schedule for'),
    startDate: dateSchema.describe('Start date of the schedule range'),
    endDate: dateSchema.describe('End date of the schedule range (max 30 days from start)'),
    includeAppointments: z
      .boolean()
      .default(true)
      .describe('Include booked appointments in the schedule (default true)'),
    includeTimeOff: z
      .boolean()
      .default(true)
      .describe('Include time off requests in the schedule (default true)'),
  })
  .describe(
    "Get a staff member's working schedule including shifts, breaks, appointments, and time off. Use to understand availability for booking or scheduling."
  );

export type GetStaffScheduleInput = z.infer<typeof getStaffScheduleSchema>;

// ============================================================================
// Get Staff Availability Schema
// ============================================================================

/**
 * Get available time slots for a staff member on a specific date.
 * Returns open slots accounting for appointments, breaks, and time off.
 */
export const getStaffAvailabilitySchema = z
  .object({
    staffId: uuidSchema.describe('The staff member to check availability for'),
    date: dateSchema.describe('Date to check availability (YYYY-MM-DD)'),
    serviceId: z
      .string()
      .uuid()
      .optional()
      .describe('Optional: Service to book - filters slots that fit the service duration'),
    minDurationMinutes: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Minimum slot duration in minutes (filters out shorter gaps)'),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .describe('Optional: Start looking from this time (HH:MM in 24hr format)'),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .describe('Optional: Stop looking after this time (HH:MM in 24hr format)'),
  })
  .describe(
    'Get available time slots for a staff member on a specific date. Use when booking appointments to find when a specific stylist is free.'
  );

export type GetStaffAvailabilityInput = z.infer<typeof getStaffAvailabilitySchema>;

// ============================================================================
// Get On Duty Staff Schema
// ============================================================================

/**
 * Get all staff members currently on duty.
 * Returns staff who are working now or on a specific date.
 */
export const getOnDutyStaffSchema = z
  .object({
    date: dateSchema
      .optional()
      .describe('Date to check (YYYY-MM-DD). Defaults to today if not specified.'),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .describe('Time to check (HH:MM in 24hr format). Defaults to current time if not specified.'),
    role: staffRoleSchema
      .optional()
      .describe('Filter by staff role'),
    includeStatus: z
      .boolean()
      .default(true)
      .describe('Include current status (available/busy/on_break) for each staff member'),
  })
  .describe(
    'Get all staff members currently on duty. Use to see who is working right now or at a specific time for walk-in availability.'
  );

export type GetOnDutyStaffInput = z.infer<typeof getOnDutyStaffSchema>;

// ============================================================================
// Get Staff Performance Schema
// ============================================================================

/**
 * Get performance metrics for a staff member.
 * Includes service counts, revenue, ratings, and productivity.
 * Note: May require manager permission to access.
 */
export const getStaffPerformanceSchema = z
  .object({
    staffId: uuidSchema.describe('The staff member to get performance metrics for'),
    period: timeRangeSchema.default('month'),
    includeRevenue: z
      .boolean()
      .default(true)
      .describe('Include revenue metrics (requires manager permission)'),
    includeRatings: z
      .boolean()
      .default(true)
      .describe('Include client rating and review summary'),
    includeProductivity: z
      .boolean()
      .default(true)
      .describe('Include productivity metrics (booking utilization, no-show rate)'),
    compareToAverage: z
      .boolean()
      .default(false)
      .describe('Include comparison to store average'),
  })
  .describe(
    "Get performance metrics for a staff member over a time period. Includes service counts, revenue, ratings, and productivity. Note: Some metrics may be restricted based on caller's permissions."
  );

export type GetStaffPerformanceInput = z.infer<typeof getStaffPerformanceSchema>;

// ============================================================================
// Tool Definitions
// ============================================================================

import type { AITool } from '../types';

/**
 * Search staff tool definition
 */
export const searchStaffTool: AITool<typeof searchStaffSchema> = {
  name: 'searchStaff',
  description:
    'Search for staff members by name, role, or availability. Use to find who can help a client, who is available for booking, or who can perform a specific service.',
  category: 'staff',
  parameters: searchStaffSchema,
  returns: z.object({
    staff: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        nickname: z.string().optional(),
        role: staffRoleSchema,
        status: staffStatusSchema.optional(),
        isAvailable: z.boolean(),
        avatarUrl: z.string().optional(),
        specialties: z.array(z.string()).optional(),
      })
    ),
    total: z.number(),
    hasMore: z.boolean(),
  }),
  tags: ['read', 'search'],
};

/**
 * Get staff tool definition
 */
export const getStaffTool: AITool<typeof getStaffSchema> = {
  name: 'getStaff',
  description:
    'Get complete details for a specific staff member including profile, skills, services they can perform, and optionally their schedule and performance metrics.',
  category: 'staff',
  parameters: getStaffSchema,
  returns: z.object({
    staff: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      nickname: z.string().optional(),
      role: staffRoleSchema,
      status: staffStatusSchema.optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      avatarUrl: z.string().optional(),
      bio: z.string().optional(),
      hireDate: z.string().optional(),
      specialties: z.array(z.string()).optional(),
      services: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            category: z.string(),
          })
        )
        .optional(),
      schedule: z
        .array(
          z.object({
            date: z.string(),
            startTime: z.string(),
            endTime: z.string(),
            isWorkingDay: z.boolean(),
          })
        )
        .optional(),
      performance: z
        .object({
          totalServices: z.number(),
          averageRating: z.number().optional(),
          reviewCount: z.number().optional(),
        })
        .optional(),
    }),
  }),
  tags: ['read'],
};

/**
 * Get staff schedule tool definition
 */
export const getStaffScheduleTool: AITool<typeof getStaffScheduleSchema> = {
  name: 'getStaffSchedule',
  description:
    "Get a staff member's working schedule for a date range including shifts, breaks, appointments, and time off. Use to understand availability for booking or scheduling.",
  category: 'staff',
  parameters: getStaffScheduleSchema,
  returns: z.object({
    staffId: z.string(),
    staffName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    schedule: z.array(
      z.object({
        date: z.string(),
        isWorkingDay: z.boolean(),
        shift: z
          .object({
            startTime: z.string(),
            endTime: z.string(),
          })
          .optional(),
        breaks: z
          .array(
            z.object({
              startTime: z.string(),
              endTime: z.string(),
              type: z.string(),
            })
          )
          .optional(),
        appointments: z
          .array(
            z.object({
              id: z.string(),
              startTime: z.string(),
              endTime: z.string(),
              clientName: z.string(),
              serviceName: z.string(),
              status: z.string(),
            })
          )
          .optional(),
        timeOff: z
          .object({
            reason: z.string(),
            isApproved: z.boolean(),
          })
          .optional(),
      })
    ),
  }),
  tags: ['read', 'schedule'],
};

/**
 * Get staff availability tool definition
 */
export const getStaffAvailabilityTool: AITool<typeof getStaffAvailabilitySchema> = {
  name: 'getStaffAvailability',
  description:
    'Get available time slots for a staff member on a specific date. Returns open slots accounting for existing appointments, breaks, and time off. Use when booking appointments.',
  category: 'staff',
  parameters: getStaffAvailabilitySchema,
  returns: z.object({
    staffId: z.string(),
    staffName: z.string(),
    date: z.string(),
    workingHours: z
      .object({
        startTime: z.string(),
        endTime: z.string(),
      })
      .optional(),
    availableSlots: z.array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        durationMinutes: z.number(),
      })
    ),
    isWorkingDay: z.boolean(),
    hasTimeOff: z.boolean(),
    nextAvailableDate: z.string().optional(),
  }),
  tags: ['read', 'availability'],
};

/**
 * Get on duty staff tool definition
 */
export const getOnDutyStaffTool: AITool<typeof getOnDutyStaffSchema> = {
  name: 'getOnDutyStaff',
  description:
    'Get all staff members currently on duty or scheduled to work at a specific time. Use to see who is working for walk-in clients or to check current staffing.',
  category: 'staff',
  parameters: getOnDutyStaffSchema,
  returns: z.object({
    date: z.string(),
    time: z.string(),
    staff: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        nickname: z.string().optional(),
        role: staffRoleSchema,
        status: staffStatusSchema.optional(),
        shift: z.object({
          startTime: z.string(),
          endTime: z.string(),
        }),
        currentAppointment: z
          .object({
            clientName: z.string(),
            serviceName: z.string(),
            endsAt: z.string(),
          })
          .optional(),
        nextAvailableAt: z.string().optional(),
      })
    ),
    totalOnDuty: z.number(),
    totalAvailable: z.number(),
  }),
  tags: ['read'],
};

/**
 * Get staff performance tool definition
 */
export const getStaffPerformanceTool: AITool<typeof getStaffPerformanceSchema> = {
  name: 'getStaffPerformance',
  description:
    "Get performance metrics for a staff member over a time period. Includes service counts, revenue, client ratings, and productivity metrics. Note: Some metrics require manager permission.",
  category: 'staff',
  parameters: getStaffPerformanceSchema,
  returns: z.object({
    staffId: z.string(),
    staffName: z.string(),
    period: timeRangeSchema,
    periodStart: z.string(),
    periodEnd: z.string(),
    services: z.object({
      totalCount: z.number(),
      byCategory: z
        .array(
          z.object({
            category: z.string(),
            count: z.number(),
          })
        )
        .optional(),
    }),
    revenue: z
      .object({
        total: z.number(),
        serviceRevenue: z.number(),
        productRevenue: z.number(),
        tipTotal: z.number(),
        averageTicket: z.number(),
      })
      .optional(),
    ratings: z
      .object({
        averageRating: z.number(),
        totalReviews: z.number(),
        fiveStarCount: z.number(),
        recentReviews: z
          .array(
            z.object({
              rating: z.number(),
              comment: z.string().optional(),
              date: z.string(),
            })
          )
          .optional(),
      })
      .optional(),
    productivity: z
      .object({
        hoursWorked: z.number(),
        bookingUtilization: z.number(),
        averageServiceDuration: z.number(),
        noShowRate: z.number(),
        rebookingRate: z.number(),
      })
      .optional(),
    comparisonToAverage: z
      .object({
        servicesVsAverage: z.number(),
        revenueVsAverage: z.number(),
        ratingVsAverage: z.number(),
      })
      .optional(),
  }),
  requiresPermission: true,
  permissionLevel: 'manager',
  tags: ['read', 'analytics', 'performance'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All staff tool schemas
 */
export const staffSchemas = {
  searchStaff: searchStaffSchema,
  getStaff: getStaffSchema,
  getStaffSchedule: getStaffScheduleSchema,
  getStaffAvailability: getStaffAvailabilitySchema,
  getOnDutyStaff: getOnDutyStaffSchema,
  getStaffPerformance: getStaffPerformanceSchema,
};

/**
 * All staff tool definitions
 */
export const staffTools = [
  searchStaffTool,
  getStaffTool,
  getStaffScheduleTool,
  getStaffAvailabilityTool,
  getOnDutyStaffTool,
  getStaffPerformanceTool,
];
