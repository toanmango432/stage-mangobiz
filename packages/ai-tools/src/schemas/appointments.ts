/**
 * @mango/ai-tools - Appointment Tool Schemas
 *
 * Zod schemas for AI tools that manage appointments in Mango Biz.
 * These tools allow AI assistants to search, view, book, reschedule, and cancel appointments.
 * All time fields use ISO 8601 format with timezone support.
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
 * ISO 8601 datetime string validation
 */
const isoDateTimeSchema = z
  .string()
  .datetime()
  .describe('Date and time in ISO 8601 format (e.g., 2024-01-15T14:30:00Z). Always include timezone.');

/**
 * Date-only string validation (YYYY-MM-DD)
 */
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date in YYYY-MM-DD format');

/**
 * Appointment status enum
 */
const appointmentStatusSchema = z
  .enum([
    'scheduled',
    'confirmed',
    'checked_in',
    'in_progress',
    'completed',
    'no_show',
    'cancelled',
  ])
  .describe(
    'Appointment status: scheduled (initial), confirmed (client confirmed), checked_in (arrived), in_progress (being served), completed (finished), no_show (did not arrive), cancelled (cancelled)'
  );

// ============================================================================
// Search Appointments Schema
// ============================================================================

/**
 * Search for appointments within a date range.
 * Can filter by staff, client, and status.
 */
export const searchAppointmentsSchema = z
  .object({
    date: dateOnlySchema.describe(
      'Date to search appointments for (YYYY-MM-DD). Returns all appointments on this date.'
    ),
    staffId: z
      .string()
      .uuid()
      .optional()
      .describe('Filter to appointments for a specific staff member'),
    clientId: z
      .string()
      .uuid()
      .optional()
      .describe('Filter to appointments for a specific client'),
    status: appointmentStatusSchema
      .optional()
      .describe('Filter by appointment status'),
    includeAllStatuses: z
      .boolean()
      .default(false)
      .describe('Include cancelled and no-show appointments (excluded by default)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(50)
      .describe('Maximum number of appointments to return (1-100, default 50)'),
  })
  .describe(
    "Search for appointments on a specific date. Filter by staff member, client, or status. By default excludes cancelled/no-show appointments unless includeAllStatuses is true."
  );

export type SearchAppointmentsInput = z.infer<typeof searchAppointmentsSchema>;

// ============================================================================
// Get Appointment Schema
// ============================================================================

/**
 * Get detailed information about a specific appointment.
 * Returns the full appointment including services, client info, and notes.
 */
export const getAppointmentSchema = z
  .object({
    appointmentId: uuidSchema.describe('The unique identifier of the appointment to retrieve'),
  })
  .describe(
    'Retrieve complete details for a specific appointment including client info, services, staff assignment, status, and notes.'
  );

export type GetAppointmentInput = z.infer<typeof getAppointmentSchema>;

// ============================================================================
// Check Availability Schema
// ============================================================================

/**
 * Check available time slots for booking an appointment.
 * Can check for a specific staff member or find any available staff.
 */
export const checkAvailabilitySchema = z
  .object({
    serviceId: uuidSchema.describe('The service to check availability for (determines duration)'),
    date: dateOnlySchema.describe('The date to check availability for (YYYY-MM-DD)'),
    staffId: z
      .string()
      .uuid()
      .optional()
      .describe(
        'Optional: Check availability for a specific staff member. If omitted, returns availability for all qualified staff.'
      ),
    durationMinutes: z
      .number()
      .int()
      .min(5)
      .max(480)
      .optional()
      .describe(
        'Optional: Override the service duration in minutes. Use when client needs extra time.'
      ),
    preferredTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .describe(
        'Optional: Preferred time in HH:MM format (24-hour). Returns closest available slots.'
      ),
    includeBreaks: z
      .boolean()
      .default(false)
      .describe('Include staff break times in the response (default false)'),
  })
  .describe(
    'Check available appointment slots for a service on a specific date. Can check specific staff or all qualified staff. Returns time slots with staff availability.'
  );

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

// ============================================================================
// Book Appointment Schema
// ============================================================================

/**
 * Book a new appointment.
 * Requires client, staff, service, and start time.
 */
export const bookAppointmentSchema = z
  .object({
    clientId: uuidSchema.describe('The client to book the appointment for'),
    staffId: uuidSchema.describe('The staff member who will perform the service'),
    serviceId: uuidSchema.describe('The service being booked'),
    startTime: isoDateTimeSchema.describe(
      'When the appointment starts (ISO 8601 with timezone). Example: 2024-01-15T14:30:00-05:00'
    ),
    notes: z
      .string()
      .max(2000)
      .optional()
      .describe('Notes for the appointment (visible to staff)'),
    clientNotes: z
      .string()
      .max(500)
      .optional()
      .describe('Notes from the client (e.g., special requests)'),
    sendConfirmation: z
      .boolean()
      .default(true)
      .describe('Send confirmation SMS/email to client (default true)'),
    source: z
      .enum(['ai_assistant', 'online_booking', 'walk_in', 'phone', 'staff'])
      .default('ai_assistant')
      .describe('How the appointment was booked'),
    additionalServices: z
      .array(
        z.object({
          serviceId: uuidSchema.describe('Additional service ID'),
          staffId: uuidSchema.optional().describe('Staff for this service (if different)'),
        })
      )
      .optional()
      .describe('Additional services to add to the same appointment'),
  })
  .describe(
    'Book a new appointment for a client. Requires client, staff, service, and start time. Use checkAvailability first to find open slots.'
  );

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

// ============================================================================
// Reschedule Appointment Schema
// ============================================================================

/**
 * Reschedule an existing appointment to a new time.
 * Optionally change the staff member.
 */
export const rescheduleAppointmentSchema = z
  .object({
    appointmentId: uuidSchema.describe('The appointment to reschedule'),
    newStartTime: isoDateTimeSchema.describe(
      'The new start time (ISO 8601 with timezone). Use checkAvailability to verify the slot is open.'
    ),
    newStaffId: z
      .string()
      .uuid()
      .optional()
      .describe('Optional: Assign to a different staff member'),
    reason: z
      .string()
      .min(1)
      .max(500)
      .describe('Reason for rescheduling (recorded for tracking)'),
    notifyClient: z
      .boolean()
      .default(true)
      .describe('Send notification to client about the change (default true)'),
    initiatedBy: z
      .enum(['client', 'staff', 'ai_assistant'])
      .default('ai_assistant')
      .describe('Who initiated the reschedule'),
  })
  .describe(
    'Reschedule an existing appointment to a new time. Always provide a reason. Client will be notified unless disabled.'
  );

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

// ============================================================================
// Cancel Appointment Schema
// ============================================================================

/**
 * Cancel an existing appointment.
 * Records the reason and optionally notifies the client.
 */
export const cancelAppointmentSchema = z
  .object({
    appointmentId: uuidSchema.describe('The appointment to cancel'),
    reason: z
      .string()
      .min(1)
      .max(500)
      .describe('Reason for cancellation (required for records)'),
    notifyClient: z
      .boolean()
      .default(true)
      .describe('Send cancellation notification to client (default true)'),
    cancellationType: z
      .enum(['client_request', 'staff_unavailable', 'no_show', 'system', 'other'])
      .default('client_request')
      .describe('Type of cancellation for reporting'),
    waiveCancellationFee: z
      .boolean()
      .default(false)
      .describe('Waive any cancellation fee (requires manager approval if false)'),
    initiatedBy: z
      .enum(['client', 'staff', 'ai_assistant'])
      .default('ai_assistant')
      .describe('Who initiated the cancellation'),
  })
  .describe(
    'Cancel an existing appointment. Always provide a reason. Consider offering to reschedule before cancelling.'
  );

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

// ============================================================================
// Tool Definitions
// ============================================================================

import type { AITool } from '../types';

/**
 * Search appointments tool definition
 */
export const searchAppointmentsTool: AITool<typeof searchAppointmentsSchema> = {
  name: 'searchAppointments',
  description:
    "Search for appointments on a specific date. Can filter by staff member, client, or status. Returns appointment summaries with times, services, and client names. By default excludes cancelled appointments.",
  category: 'appointments',
  parameters: searchAppointmentsSchema,
  returns: z.object({
    appointments: z.array(
      z.object({
        id: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        status: appointmentStatusSchema,
        clientName: z.string(),
        clientId: z.string(),
        staffName: z.string(),
        staffId: z.string(),
        services: z.array(
          z.object({
            name: z.string(),
            durationMinutes: z.number(),
          })
        ),
        hasNotes: z.boolean(),
      })
    ),
    total: z.number(),
    date: z.string(),
  }),
  tags: ['read', 'search'],
};

/**
 * Get appointment tool definition
 */
export const getAppointmentTool: AITool<typeof getAppointmentSchema> = {
  name: 'getAppointment',
  description:
    'Get complete details for a specific appointment including services, client information, staff assignment, status history, and any notes.',
  category: 'appointments',
  parameters: getAppointmentSchema,
  returns: z.object({
    appointment: z.object({
      id: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      status: appointmentStatusSchema,
      client: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        phone: z.string(),
        email: z.string().optional(),
      }),
      staff: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      }),
      services: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          durationMinutes: z.number(),
          staffId: z.string().optional(),
        })
      ),
      notes: z.string().optional(),
      clientNotes: z.string().optional(),
      source: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      confirmedAt: z.string().optional(),
      checkedInAt: z.string().optional(),
      completedAt: z.string().optional(),
      cancelledAt: z.string().optional(),
      cancellationReason: z.string().optional(),
    }),
  }),
  tags: ['read'],
};

/**
 * Check availability tool definition
 */
export const checkAvailabilityTool: AITool<typeof checkAvailabilitySchema> = {
  name: 'checkAvailability',
  description:
    'Check available appointment slots for a service on a specific date. Can check for a specific staff member or find all available staff. Returns time slots with availability information. Use before booking to ensure slot is open.',
  category: 'appointments',
  parameters: checkAvailabilitySchema,
  returns: z.object({
    date: z.string(),
    service: z.object({
      id: z.string(),
      name: z.string(),
      durationMinutes: z.number(),
    }),
    availableSlots: z.array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        staff: z.array(
          z.object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string(),
          })
        ),
      })
    ),
    unavailableReasons: z
      .array(
        z.object({
          staffId: z.string(),
          staffName: z.string(),
          reason: z.enum(['day_off', 'fully_booked', 'break', 'not_qualified']),
        })
      )
      .optional(),
  }),
  tags: ['read', 'availability'],
};

/**
 * Book appointment tool definition
 */
export const bookAppointmentTool: AITool<typeof bookAppointmentSchema> = {
  name: 'bookAppointment',
  description:
    'Book a new appointment for a client. Requires client ID, staff ID, service ID, and start time. Use checkAvailability first to verify the slot is open. Sends confirmation to client by default.',
  category: 'appointments',
  parameters: bookAppointmentSchema,
  returns: z.object({
    appointment: z.object({
      id: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      status: z.literal('scheduled'),
      clientId: z.string(),
      staffId: z.string(),
      services: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      ),
      confirmationSent: z.boolean(),
    }),
  }),
  tags: ['write', 'create'],
};

/**
 * Reschedule appointment tool definition
 */
export const rescheduleAppointmentTool: AITool<typeof rescheduleAppointmentSchema> = {
  name: 'rescheduleAppointment',
  description:
    'Reschedule an existing appointment to a new time. Use checkAvailability first to verify the new slot is open. Provide a reason for the change. Client will be notified unless disabled.',
  category: 'appointments',
  parameters: rescheduleAppointmentSchema,
  returns: z.object({
    appointment: z.object({
      id: z.string(),
      previousStartTime: z.string(),
      newStartTime: z.string(),
      newEndTime: z.string(),
      staffId: z.string(),
      notificationSent: z.boolean(),
    }),
  }),
  tags: ['write', 'update'],
};

/**
 * Cancel appointment tool definition
 */
export const cancelAppointmentTool: AITool<typeof cancelAppointmentSchema> = {
  name: 'cancelAppointment',
  description:
    'Cancel an existing appointment. Always provide a reason. Consider offering to reschedule before cancelling. Client will be notified unless disabled. Cancellation fees may apply unless waived.',
  category: 'appointments',
  parameters: cancelAppointmentSchema,
  returns: z.object({
    appointment: z.object({
      id: z.string(),
      previousStatus: appointmentStatusSchema,
      cancelledAt: z.string(),
      reason: z.string(),
      notificationSent: z.boolean(),
      cancellationFeeApplied: z.boolean(),
      cancellationFeeAmount: z.number().optional(),
    }),
  }),
  requiresPermission: true,
  permissionLevel: 'staff',
  tags: ['write', 'delete'],
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All appointment tool schemas
 */
export const appointmentSchemas = {
  searchAppointments: searchAppointmentsSchema,
  getAppointment: getAppointmentSchema,
  checkAvailability: checkAvailabilitySchema,
  bookAppointment: bookAppointmentSchema,
  rescheduleAppointment: rescheduleAppointmentSchema,
  cancelAppointment: cancelAppointmentSchema,
};

/**
 * All appointment tool definitions
 */
export const appointmentTools = [
  searchAppointmentsTool,
  getAppointmentTool,
  checkAvailabilityTool,
  bookAppointmentTool,
  rescheduleAppointmentTool,
  cancelAppointmentTool,
];
