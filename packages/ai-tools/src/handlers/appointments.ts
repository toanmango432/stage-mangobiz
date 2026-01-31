/**
 * @mango/ai-tools - Appointment Tool Handlers
 *
 * Handlers for executing appointment-related AI tools.
 * These handlers bridge AI tool calls to business operations via the data provider.
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
  SearchAppointmentsInput,
  GetAppointmentInput,
  CheckAvailabilityInput,
  BookAppointmentInput,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
} from '../schemas/appointments';

// ============================================================================
// Data Provider Interface
// ============================================================================

/**
 * Interface for appointment data operations.
 * Implementations can use Supabase, IndexedDB, or any other data source.
 * This interface is injected at runtime to decouple handlers from data layer.
 */
export interface AppointmentDataProvider {
  /**
   * Search for appointments on a date
   */
  searchAppointments(params: {
    storeId: string;
    date: string;
    staffId?: string;
    clientId?: string;
    status?: string;
    includeAllStatuses: boolean;
    limit: number;
  }): Promise<{
    appointments: AppointmentSummary[];
    total: number;
    date: string;
  }>;

  /**
   * Get a single appointment by ID
   */
  getAppointment(params: {
    storeId: string;
    appointmentId: string;
  }): Promise<AppointmentDetails | null>;

  /**
   * Check availability for a service on a date
   */
  checkAvailability(params: {
    storeId: string;
    serviceId: string;
    date: string;
    staffId?: string;
    durationMinutes?: number;
    preferredTime?: string;
    includeBreaks: boolean;
  }): Promise<AvailabilityResult>;

  /**
   * Book a new appointment
   */
  bookAppointment(params: {
    storeId: string;
    data: BookAppointmentData;
    userId: string;
  }): Promise<BookedAppointment>;

  /**
   * Reschedule an existing appointment
   */
  rescheduleAppointment(params: {
    storeId: string;
    appointmentId: string;
    newStartTime: string;
    newStaffId?: string;
    reason: string;
    notifyClient: boolean;
    initiatedBy: string;
    userId: string;
  }): Promise<RescheduledAppointment>;

  /**
   * Cancel an existing appointment
   */
  cancelAppointment(params: {
    storeId: string;
    appointmentId: string;
    reason: string;
    notifyClient: boolean;
    cancellationType: string;
    waiveCancellationFee: boolean;
    initiatedBy: string;
    userId: string;
  }): Promise<CancelledAppointment>;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Appointment status enum
 */
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled';

/**
 * Summary appointment info returned by search
 */
export interface AppointmentSummary {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  clientName: string;
  clientId: string;
  staffName: string;
  staffId: string;
  services: Array<{
    name: string;
    durationMinutes: number;
  }>;
  hasNotes: boolean;
}

/**
 * Full appointment details
 */
export interface AppointmentDetails {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  staff: {
    id: string;
    firstName: string;
    lastName: string;
  };
  services: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    staffId?: string;
  }>;
  notes?: string;
  clientNotes?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

/**
 * Availability check result
 */
export interface AvailabilityResult {
  date: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
  availableSlots: Array<{
    startTime: string;
    endTime: string;
    staff: Array<{
      id: string;
      firstName: string;
      lastName: string;
    }>;
  }>;
  unavailableReasons?: Array<{
    staffId: string;
    staffName: string;
    reason: 'day_off' | 'fully_booked' | 'break' | 'not_qualified';
  }>;
}

/**
 * Data for booking an appointment
 */
export interface BookAppointmentData {
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
  clientNotes?: string;
  sendConfirmation: boolean;
  source: string;
  additionalServices?: Array<{
    serviceId: string;
    staffId?: string;
  }>;
}

/**
 * Booked appointment response
 */
export interface BookedAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: 'scheduled';
  clientId: string;
  staffId: string;
  services: Array<{
    id: string;
    name: string;
  }>;
  confirmationSent: boolean;
}

/**
 * Rescheduled appointment response
 */
export interface RescheduledAppointment {
  id: string;
  previousStartTime: string;
  newStartTime: string;
  newEndTime: string;
  staffId: string;
  notificationSent: boolean;
}

/**
 * Cancelled appointment response
 */
export interface CancelledAppointment {
  id: string;
  previousStatus: AppointmentStatus;
  cancelledAt: string;
  reason: string;
  notificationSent: boolean;
  cancellationFeeApplied: boolean;
  cancellationFeeAmount?: number;
}

// ============================================================================
// Handler State
// ============================================================================

/**
 * Data provider instance (must be set before handlers can be used)
 */
let dataProvider: AppointmentDataProvider | null = null;

/**
 * Set the data provider for appointment handlers.
 * Must be called during app initialization before any handlers are invoked.
 *
 * @param provider - The data provider implementation
 */
export function setAppointmentDataProvider(provider: AppointmentDataProvider): void {
  dataProvider = provider;
}

/**
 * Get the current data provider.
 * Throws if not initialized.
 */
function getDataProvider(): AppointmentDataProvider {
  if (!dataProvider) {
    throw new Error(
      'Appointment data provider not initialized. Call setAppointmentDataProvider() during app setup.'
    );
  }
  return dataProvider;
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle searchAppointments tool invocation.
 *
 * Searches for appointments on a specific date with optional filters.
 */
export const handleSearchAppointments: ToolHandler<
  SearchAppointmentsInput,
  {
    appointments: AppointmentSummary[];
    total: number;
    date: string;
  }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing searchAppointments', {
    date: input.date,
    staffId: input.staffId,
    clientId: input.clientId,
    status: input.status,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.searchAppointments({
      storeId: context.storeId,
      date: input.date,
      staffId: input.staffId,
      clientId: input.clientId,
      status: input.status,
      includeAllStatuses: input.includeAllStatuses,
      limit: input.limit,
    });

    context.logger.info('searchAppointments completed', {
      resultCount: result.appointments.length,
      total: result.total,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.appointments.length,
      total: result.total,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('searchAppointments failed', { error: errorMessage });

    return errorResult(
      `Failed to search appointments: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getAppointment tool invocation.
 *
 * Retrieves complete details for a specific appointment.
 */
export const handleGetAppointment: ToolHandler<
  GetAppointmentInput,
  { appointment: AppointmentDetails }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getAppointment', {
    appointmentId: input.appointmentId,
  });

  try {
    const provider = getDataProvider();

    const appointment = await provider.getAppointment({
      storeId: context.storeId,
      appointmentId: input.appointmentId,
    });

    if (!appointment) {
      context.logger.warn('Appointment not found', { appointmentId: input.appointmentId });
      return errorResult(
        `Appointment with ID '${input.appointmentId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getAppointment completed', {
      appointmentId: appointment.id,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { appointment },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getAppointment failed', { error: errorMessage });

    return errorResult(
      `Failed to get appointment: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle checkAvailability tool invocation.
 *
 * Checks available time slots for a service on a specific date.
 */
export const handleCheckAvailability: ToolHandler<
  CheckAvailabilityInput,
  AvailabilityResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing checkAvailability', {
    serviceId: input.serviceId,
    date: input.date,
    staffId: input.staffId,
    preferredTime: input.preferredTime,
  });

  try {
    const provider = getDataProvider();

    const availability = await provider.checkAvailability({
      storeId: context.storeId,
      serviceId: input.serviceId,
      date: input.date,
      staffId: input.staffId,
      durationMinutes: input.durationMinutes,
      preferredTime: input.preferredTime,
      includeBreaks: input.includeBreaks,
    });

    context.logger.info('checkAvailability completed', {
      date: input.date,
      slotsFound: availability.availableSlots.length,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(availability, {
      executionTimeMs: Date.now() - startTime,
      count: availability.availableSlots.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('checkAvailability failed', { error: errorMessage });

    // Check for service not found
    if (errorMessage.toLowerCase().includes('service') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Service with ID '${input.serviceId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to check availability: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle bookAppointment tool invocation.
 *
 * Books a new appointment for a client.
 */
export const handleBookAppointment: ToolHandler<
  BookAppointmentInput,
  { appointment: BookedAppointment }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing bookAppointment', {
    clientId: input.clientId,
    staffId: input.staffId,
    serviceId: input.serviceId,
    startTime: input.startTime,
  });

  try {
    const provider = getDataProvider();

    const bookedAppointment = await provider.bookAppointment({
      storeId: context.storeId,
      data: {
        clientId: input.clientId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        startTime: input.startTime,
        notes: input.notes,
        clientNotes: input.clientNotes,
        sendConfirmation: input.sendConfirmation,
        source: input.source,
        additionalServices: input.additionalServices,
      },
      userId: context.userId,
    });

    context.logger.info('bookAppointment completed', {
      appointmentId: bookedAppointment.id,
      confirmationSent: bookedAppointment.confirmationSent,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { appointment: bookedAppointment },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('bookAppointment failed', { error: errorMessage });

    // Check for conflict (double booking)
    if (errorMessage.toLowerCase().includes('conflict') ||
        errorMessage.toLowerCase().includes('already booked') ||
        errorMessage.toLowerCase().includes('not available')) {
      return errorResult(
        `The requested time slot is not available. Please check availability and try a different time.`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for not found errors
    if (errorMessage.toLowerCase().includes('client') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Client with ID '${input.clientId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    if (errorMessage.toLowerCase().includes('staff') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    if (errorMessage.toLowerCase().includes('service') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Service with ID '${input.serviceId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to book appointment: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle rescheduleAppointment tool invocation.
 *
 * Reschedules an existing appointment to a new time.
 */
export const handleRescheduleAppointment: ToolHandler<
  RescheduleAppointmentInput,
  { appointment: RescheduledAppointment }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing rescheduleAppointment', {
    appointmentId: input.appointmentId,
    newStartTime: input.newStartTime,
    newStaffId: input.newStaffId,
    initiatedBy: input.initiatedBy,
  });

  try {
    const provider = getDataProvider();

    const rescheduledAppointment = await provider.rescheduleAppointment({
      storeId: context.storeId,
      appointmentId: input.appointmentId,
      newStartTime: input.newStartTime,
      newStaffId: input.newStaffId,
      reason: input.reason,
      notifyClient: input.notifyClient,
      initiatedBy: input.initiatedBy,
      userId: context.userId,
    });

    context.logger.info('rescheduleAppointment completed', {
      appointmentId: rescheduledAppointment.id,
      previousTime: rescheduledAppointment.previousStartTime,
      newTime: rescheduledAppointment.newStartTime,
      notificationSent: rescheduledAppointment.notificationSent,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { appointment: rescheduledAppointment },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('rescheduleAppointment failed', { error: errorMessage });

    // Check for not found
    if (errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Appointment with ID '${input.appointmentId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for conflict
    if (errorMessage.toLowerCase().includes('conflict') ||
        errorMessage.toLowerCase().includes('not available')) {
      return errorResult(
        `The requested time slot is not available. Please check availability and try a different time.`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for invalid state (can't reschedule completed/cancelled)
    if (errorMessage.toLowerCase().includes('cannot reschedule') ||
        errorMessage.toLowerCase().includes('invalid status')) {
      return errorResult(
        `Cannot reschedule this appointment - it may be completed, cancelled, or in an invalid state.`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to reschedule appointment: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle cancelAppointment tool invocation.
 *
 * Cancels an existing appointment.
 */
export const handleCancelAppointment: ToolHandler<
  CancelAppointmentInput,
  { appointment: CancelledAppointment }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing cancelAppointment', {
    appointmentId: input.appointmentId,
    cancellationType: input.cancellationType,
    waiveCancellationFee: input.waiveCancellationFee,
    initiatedBy: input.initiatedBy,
  });

  try {
    const provider = getDataProvider();

    const cancelledAppointment = await provider.cancelAppointment({
      storeId: context.storeId,
      appointmentId: input.appointmentId,
      reason: input.reason,
      notifyClient: input.notifyClient,
      cancellationType: input.cancellationType,
      waiveCancellationFee: input.waiveCancellationFee,
      initiatedBy: input.initiatedBy,
      userId: context.userId,
    });

    context.logger.info('cancelAppointment completed', {
      appointmentId: cancelledAppointment.id,
      previousStatus: cancelledAppointment.previousStatus,
      cancellationFeeApplied: cancelledAppointment.cancellationFeeApplied,
      notificationSent: cancelledAppointment.notificationSent,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { appointment: cancelledAppointment },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('cancelAppointment failed', { error: errorMessage });

    // Check for not found
    if (errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Appointment with ID '${input.appointmentId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for invalid state
    if (errorMessage.toLowerCase().includes('already cancelled') ||
        errorMessage.toLowerCase().includes('cannot cancel')) {
      return errorResult(
        `Cannot cancel this appointment - it may already be cancelled or completed.`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    // Check for permission denied (e.g., can't waive fee without manager)
    if (errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('manager approval')) {
      return errorResult(
        `Permission denied: Manager approval required to waive cancellation fee.`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to cancel appointment: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All appointment tool handlers mapped by tool name.
 */
export const appointmentHandlers = {
  searchAppointments: handleSearchAppointments,
  getAppointment: handleGetAppointment,
  checkAvailability: handleCheckAvailability,
  bookAppointment: handleBookAppointment,
  rescheduleAppointment: handleRescheduleAppointment,
  cancelAppointment: handleCancelAppointment,
};
