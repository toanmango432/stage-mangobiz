/**
 * @mango/ai-tools - Staff Tool Handlers
 *
 * Handlers for executing staff-related AI tools.
 * These handlers bridge AI tool calls to business operations via the data provider.
 *
 * Note: Some staff data (like performance metrics, commission rates) may be restricted
 * based on the requesting user's permissions.
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
  SearchStaffInput,
  GetStaffInput,
  GetStaffScheduleInput,
  GetStaffAvailabilityInput,
  GetOnDutyStaffInput,
  GetStaffPerformanceInput,
} from '../schemas/staff';

// ============================================================================
// Data Provider Interface
// ============================================================================

/**
 * Interface for staff data operations.
 * Implementations can use Supabase, IndexedDB, or any other data source.
 * This interface is injected at runtime to decouple handlers from data layer.
 */
export interface StaffDataProvider {
  /**
   * Search for staff members
   */
  searchStaff(params: {
    storeId: string;
    query?: string;
    role?: string;
    available?: boolean;
    canPerformServiceId?: string;
    includeInactive: boolean;
    limit: number;
    offset: number;
  }): Promise<{
    staff: StaffSummary[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Get a single staff member by ID
   */
  getStaff(params: {
    storeId: string;
    staffId: string;
    includePerformance: boolean;
    includeSchedule: boolean;
  }): Promise<StaffDetails | null>;

  /**
   * Get a staff member's schedule
   */
  getStaffSchedule(params: {
    storeId: string;
    staffId: string;
    startDate: string;
    endDate: string;
    includeAppointments: boolean;
    includeTimeOff: boolean;
  }): Promise<StaffScheduleResult | null>;

  /**
   * Get available time slots for a staff member
   */
  getStaffAvailability(params: {
    storeId: string;
    staffId: string;
    date: string;
    serviceId?: string;
    minDurationMinutes?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<StaffAvailabilityResult | null>;

  /**
   * Get all staff currently on duty
   */
  getOnDutyStaff(params: {
    storeId: string;
    date?: string;
    time?: string;
    role?: string;
    includeStatus: boolean;
  }): Promise<OnDutyStaffResult>;

  /**
   * Get performance metrics for a staff member
   */
  getStaffPerformance(params: {
    storeId: string;
    staffId: string;
    period: 'week' | 'month' | 'quarter';
    includeRevenue: boolean;
    includeRatings: boolean;
    includeProductivity: boolean;
    compareToAverage: boolean;
    userId: string;
  }): Promise<StaffPerformanceResult | null>;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Staff role type
 */
export type StaffRole =
  | 'stylist'
  | 'colorist'
  | 'nail_tech'
  | 'esthetician'
  | 'massage_therapist'
  | 'barber'
  | 'receptionist'
  | 'manager'
  | 'assistant'
  | 'apprentice'
  | 'owner'
  | 'other';

/**
 * Staff status type
 */
export type StaffStatus = 'available' | 'busy' | 'on_break' | 'off_duty' | 'checked_out';

/**
 * Summary staff info returned by search
 */
export interface StaffSummary {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  role: StaffRole;
  status?: StaffStatus;
  isAvailable: boolean;
  avatarUrl?: string;
  specialties?: string[];
}

/**
 * Full staff details
 */
export interface StaffDetails {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  role: StaffRole;
  status?: StaffStatus;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  hireDate?: string;
  specialties?: string[];
  services?: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  schedule?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
  }>;
  performance?: {
    totalServices: number;
    averageRating?: number;
    reviewCount?: number;
  };
}

/**
 * Staff schedule result
 */
export interface StaffScheduleResult {
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  schedule: Array<{
    date: string;
    isWorkingDay: boolean;
    shift?: {
      startTime: string;
      endTime: string;
    };
    breaks?: Array<{
      startTime: string;
      endTime: string;
      type: string;
    }>;
    appointments?: Array<{
      id: string;
      startTime: string;
      endTime: string;
      clientName: string;
      serviceName: string;
      status: string;
    }>;
    timeOff?: {
      reason: string;
      isApproved: boolean;
    };
  }>;
}

/**
 * Staff availability result
 */
export interface StaffAvailabilityResult {
  staffId: string;
  staffName: string;
  date: string;
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  availableSlots: Array<{
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }>;
  isWorkingDay: boolean;
  hasTimeOff: boolean;
  nextAvailableDate?: string;
}

/**
 * On duty staff result
 */
export interface OnDutyStaffResult {
  date: string;
  time: string;
  staff: Array<{
    id: string;
    firstName: string;
    lastName: string;
    nickname?: string;
    role: StaffRole;
    status?: StaffStatus;
    shift: {
      startTime: string;
      endTime: string;
    };
    currentAppointment?: {
      clientName: string;
      serviceName: string;
      endsAt: string;
    };
    nextAvailableAt?: string;
  }>;
  totalOnDuty: number;
  totalAvailable: number;
}

/**
 * Staff performance result
 */
export interface StaffPerformanceResult {
  staffId: string;
  staffName: string;
  period: 'week' | 'month' | 'quarter';
  periodStart: string;
  periodEnd: string;
  services: {
    totalCount: number;
    byCategory?: Array<{
      category: string;
      count: number;
    }>;
  };
  revenue?: {
    total: number;
    serviceRevenue: number;
    productRevenue: number;
    tipTotal: number;
    averageTicket: number;
  };
  ratings?: {
    averageRating: number;
    totalReviews: number;
    fiveStarCount: number;
    recentReviews?: Array<{
      rating: number;
      comment?: string;
      date: string;
    }>;
  };
  productivity?: {
    hoursWorked: number;
    bookingUtilization: number;
    averageServiceDuration: number;
    noShowRate: number;
    rebookingRate: number;
  };
  comparisonToAverage?: {
    servicesVsAverage: number;
    revenueVsAverage: number;
    ratingVsAverage: number;
  };
}

// ============================================================================
// Handler State
// ============================================================================

/**
 * Data provider instance (must be set before handlers can be used)
 */
let dataProvider: StaffDataProvider | null = null;

/**
 * Set the data provider for staff handlers.
 * Must be called during app initialization before any handlers are invoked.
 *
 * @param provider - The data provider implementation
 */
export function setStaffDataProvider(provider: StaffDataProvider): void {
  dataProvider = provider;
}

/**
 * Get the current data provider.
 * Throws if not initialized.
 */
function getDataProvider(): StaffDataProvider {
  if (!dataProvider) {
    throw new Error(
      'Staff data provider not initialized. Call setStaffDataProvider() during app setup.'
    );
  }
  return dataProvider;
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle searchStaff tool invocation.
 *
 * Searches for staff members by name, role, or availability.
 */
export const handleSearchStaff: ToolHandler<
  SearchStaffInput,
  {
    staff: StaffSummary[];
    total: number;
    hasMore: boolean;
  }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing searchStaff', {
    query: input.query,
    role: input.role,
    available: input.available,
    limit: input.limit,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.searchStaff({
      storeId: context.storeId,
      query: input.query,
      role: input.role,
      available: input.available,
      canPerformServiceId: input.canPerformServiceId,
      includeInactive: input.includeInactive,
      limit: input.limit,
      offset: input.offset,
    });

    context.logger.info('searchStaff completed', {
      resultCount: result.staff.length,
      total: result.total,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.staff.length,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('searchStaff failed', { error: errorMessage });

    return errorResult(
      `Failed to search staff: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getStaff tool invocation.
 *
 * Retrieves complete details for a specific staff member.
 */
export const handleGetStaff: ToolHandler<
  GetStaffInput,
  { staff: StaffDetails }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getStaff', {
    staffId: input.staffId,
    includePerformance: input.includePerformance,
    includeSchedule: input.includeSchedule,
  });

  try {
    const provider = getDataProvider();

    const staff = await provider.getStaff({
      storeId: context.storeId,
      staffId: input.staffId,
      includePerformance: input.includePerformance,
      includeSchedule: input.includeSchedule,
    });

    if (!staff) {
      context.logger.warn('Staff not found', { staffId: input.staffId });
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getStaff completed', {
      staffId: staff.id,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { staff },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getStaff failed', { error: errorMessage });

    // Check for permission denied on performance data
    if (input.includePerformance &&
        errorMessage.toLowerCase().includes('permission')) {
      return errorResult(
        `Permission denied: Manager access required for performance data`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get staff: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getStaffSchedule tool invocation.
 *
 * Gets a staff member's schedule for a date range.
 */
export const handleGetStaffSchedule: ToolHandler<
  GetStaffScheduleInput,
  StaffScheduleResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getStaffSchedule', {
    staffId: input.staffId,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  try {
    const provider = getDataProvider();

    const schedule = await provider.getStaffSchedule({
      storeId: context.storeId,
      staffId: input.staffId,
      startDate: input.startDate,
      endDate: input.endDate,
      includeAppointments: input.includeAppointments,
      includeTimeOff: input.includeTimeOff,
    });

    if (!schedule) {
      context.logger.warn('Staff not found for schedule', { staffId: input.staffId });
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getStaffSchedule completed', {
      staffId: input.staffId,
      daysReturned: schedule.schedule.length,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(schedule, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getStaffSchedule failed', { error: errorMessage });

    // Check for date range too large
    if (errorMessage.toLowerCase().includes('date range') ||
        errorMessage.toLowerCase().includes('too large')) {
      return errorResult(
        `Date range is too large. Maximum is 30 days.`,
        'INVALID_INPUT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get staff schedule: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getStaffAvailability tool invocation.
 *
 * Gets available time slots for a staff member on a specific date.
 */
export const handleGetStaffAvailability: ToolHandler<
  GetStaffAvailabilityInput,
  StaffAvailabilityResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getStaffAvailability', {
    staffId: input.staffId,
    date: input.date,
    serviceId: input.serviceId,
    minDurationMinutes: input.minDurationMinutes,
  });

  try {
    const provider = getDataProvider();

    const availability = await provider.getStaffAvailability({
      storeId: context.storeId,
      staffId: input.staffId,
      date: input.date,
      serviceId: input.serviceId,
      minDurationMinutes: input.minDurationMinutes,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    if (!availability) {
      context.logger.warn('Staff not found for availability', { staffId: input.staffId });
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getStaffAvailability completed', {
      staffId: input.staffId,
      date: input.date,
      slotsFound: availability.availableSlots.length,
      isWorkingDay: availability.isWorkingDay,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(availability, {
      executionTimeMs: Date.now() - startTime,
      count: availability.availableSlots.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getStaffAvailability failed', { error: errorMessage });

    // Check for service not found
    if (input.serviceId &&
        errorMessage.toLowerCase().includes('service') &&
        errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Service with ID '${input.serviceId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get staff availability: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getOnDutyStaff tool invocation.
 *
 * Gets all staff members currently on duty.
 */
export const handleGetOnDutyStaff: ToolHandler<
  GetOnDutyStaffInput,
  OnDutyStaffResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getOnDutyStaff', {
    date: input.date,
    time: input.time,
    role: input.role,
    includeStatus: input.includeStatus,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.getOnDutyStaff({
      storeId: context.storeId,
      date: input.date,
      time: input.time,
      role: input.role,
      includeStatus: input.includeStatus,
    });

    context.logger.info('getOnDutyStaff completed', {
      totalOnDuty: result.totalOnDuty,
      totalAvailable: result.totalAvailable,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.staff.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getOnDutyStaff failed', { error: errorMessage });

    return errorResult(
      `Failed to get on-duty staff: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getStaffPerformance tool invocation.
 *
 * Gets performance metrics for a staff member.
 * Note: May require manager permission for sensitive data like revenue.
 */
export const handleGetStaffPerformance: ToolHandler<
  GetStaffPerformanceInput,
  StaffPerformanceResult
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getStaffPerformance', {
    staffId: input.staffId,
    period: input.period,
    includeRevenue: input.includeRevenue,
    includeRatings: input.includeRatings,
  });

  try {
    const provider = getDataProvider();

    const performance = await provider.getStaffPerformance({
      storeId: context.storeId,
      staffId: input.staffId,
      period: input.period,
      includeRevenue: input.includeRevenue,
      includeRatings: input.includeRatings,
      includeProductivity: input.includeProductivity,
      compareToAverage: input.compareToAverage,
      userId: context.userId,
    });

    if (!performance) {
      context.logger.warn('Staff not found for performance', { staffId: input.staffId });
      return errorResult(
        `Staff member with ID '${input.staffId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getStaffPerformance completed', {
      staffId: input.staffId,
      period: input.period,
      totalServices: performance.services.totalCount,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(performance, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getStaffPerformance failed', { error: errorMessage });

    // Check for permission denied
    if (errorMessage.toLowerCase().includes('permission') ||
        errorMessage.toLowerCase().includes('manager')) {
      return errorResult(
        `Permission denied: Manager access required for performance metrics`,
        'PERMISSION_DENIED',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to get staff performance: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All staff tool handlers mapped by tool name.
 */
export const staffHandlers = {
  searchStaff: handleSearchStaff,
  getStaff: handleGetStaff,
  getStaffSchedule: handleGetStaffSchedule,
  getStaffAvailability: handleGetStaffAvailability,
  getOnDutyStaff: handleGetOnDutyStaff,
  getStaffPerformance: handleGetStaffPerformance,
};
