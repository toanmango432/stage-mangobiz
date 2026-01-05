/**
 * Validation Utilities for Team Settings Module
 *
 * Provides type-safe validation functions that wrap Zod schemas.
 * Use these functions at UI, Redux, and Database layers.
 */

import { z } from 'zod';
import {
  TeamMemberSettingsSchema,
  TeamMemberProfileSchema,
  ServicePricingSchema,
  WorkingHoursSettingsSchema,
  RolePermissionsSchema,
  CommissionSettingsSchema,
  PayrollSettingsSchema,
  OnlineBookingSettingsSchema,
  NotificationPreferencesSchema,
  PerformanceGoalsSchema,
  TimeOffRequestSchema,
  ScheduleOverrideSchema,
  UpdateProfileSchema,
  UpdateServicesSchema,
  UpdateWorkingHoursSchema,
  UpdatePermissionsSchema,
  UpdateCommissionSchema,
  UpdatePayrollSchema,
  UpdateOnlineBookingSchema,
  UpdateNotificationsSchema,
  UpdatePerformanceGoalsSchema,
} from './schemas';

import type {
  TeamMemberSettingsType,
  TeamMemberProfileType,
  ServicePricingType,
  WorkingHoursSettingsType,
  RolePermissionsType,
  CommissionSettingsType,
  PayrollSettingsType,
  OnlineBookingSettingsType,
  NotificationPreferencesType,
  PerformanceGoalsType,
} from './schemas';

// ============================================
// CUSTOM VALIDATION ERROR
// ============================================

export interface ValidationErrorDetail {
  path: (string | number)[];
  message: string;
  code: string;
}

/**
 * Custom error class for validation failures.
 * Includes structured error details for UI display.
 */
export class ValidationError extends Error {
  public readonly errors: ValidationErrorDetail[];

  constructor(message: string, zodError: z.ZodError) {
    super(message);
    this.name = 'ValidationError';
    this.errors = zodError.errors.map((err) => ({
      path: err.path,
      message: err.message,
      code: err.code,
    }));
  }

  /**
   * Get error message for a specific field path.
   */
  getFieldError(path: string): string | undefined {
    const error = this.errors.find((e) => e.path.join('.') === path);
    return error?.message;
  }

  /**
   * Get all errors as a flat object keyed by path.
   */
  getErrorMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const err of this.errors) {
      map[err.path.join('.')] = err.message;
    }
    return map;
  }
}

// ============================================
// VALIDATION RESULT TYPE
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

// ============================================
// FULL ENTITY VALIDATORS
// ============================================

/**
 * Validate a complete TeamMemberSettings entity.
 * Throws ValidationError if invalid.
 */
export function validateTeamMemberSettings(data: unknown): TeamMemberSettingsType {
  const result = TeamMemberSettingsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid team member settings', result.error);
  }
  return result.data;
}

/**
 * Safe version that returns a result object instead of throwing.
 */
export function safeValidateTeamMemberSettings(
  data: unknown
): ValidationResult<TeamMemberSettingsType> {
  const result = TeamMemberSettingsSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: new ValidationError('Invalid team member settings', result.error),
    };
  }
  return { success: true, data: result.data };
}

// ============================================
// SECTION VALIDATORS
// ============================================

export function validateProfile(data: unknown): TeamMemberProfileType {
  const result = TeamMemberProfileSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid profile data', result.error);
  }
  return result.data;
}

export function safeValidateProfile(data: unknown): ValidationResult<TeamMemberProfileType> {
  const result = TeamMemberProfileSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: new ValidationError('Invalid profile data', result.error) };
  }
  return { success: true, data: result.data };
}

export function validateServicePricing(data: unknown): ServicePricingType {
  const result = ServicePricingSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid service pricing', result.error);
  }
  return result.data;
}

export function validateServices(data: unknown): ServicePricingType[] {
  const result = z.array(ServicePricingSchema).safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid services data', result.error);
  }
  return result.data;
}

export function validateWorkingHours(data: unknown): WorkingHoursSettingsType {
  const result = WorkingHoursSettingsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid working hours', result.error);
  }
  return result.data;
}

export function validatePermissions(data: unknown): RolePermissionsType {
  const result = RolePermissionsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid permissions', result.error);
  }
  return result.data;
}

export function validateCommission(data: unknown): CommissionSettingsType {
  const result = CommissionSettingsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid commission settings', result.error);
  }
  return result.data;
}

export function validatePayroll(data: unknown): PayrollSettingsType {
  const result = PayrollSettingsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid payroll settings', result.error);
  }
  return result.data;
}

export function validateOnlineBooking(data: unknown): OnlineBookingSettingsType {
  const result = OnlineBookingSettingsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid online booking settings', result.error);
  }
  return result.data;
}

export function validateNotifications(data: unknown): NotificationPreferencesType {
  const result = NotificationPreferencesSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid notification preferences', result.error);
  }
  return result.data;
}

export function validatePerformanceGoals(data: unknown): PerformanceGoalsType {
  const result = PerformanceGoalsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid performance goals', result.error);
  }
  return result.data;
}

// ============================================
// PARTIAL UPDATE VALIDATORS
// ============================================

export function validateProfileUpdate(
  data: unknown
): z.infer<typeof UpdateProfileSchema> {
  const result = UpdateProfileSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid profile update', result.error);
  }
  return result.data;
}

export function validateServicesUpdate(
  data: unknown
): z.infer<typeof UpdateServicesSchema> {
  const result = UpdateServicesSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid services update', result.error);
  }
  return result.data;
}

export function validateWorkingHoursUpdate(
  data: unknown
): z.infer<typeof UpdateWorkingHoursSchema> {
  const result = UpdateWorkingHoursSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid working hours update', result.error);
  }
  return result.data;
}

export function validatePermissionsUpdate(
  data: unknown
): z.infer<typeof UpdatePermissionsSchema> {
  const result = UpdatePermissionsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid permissions update', result.error);
  }
  return result.data;
}

export function validateCommissionUpdate(
  data: unknown
): z.infer<typeof UpdateCommissionSchema> {
  const result = UpdateCommissionSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid commission update', result.error);
  }
  return result.data;
}

export function validatePayrollUpdate(
  data: unknown
): z.infer<typeof UpdatePayrollSchema> {
  const result = UpdatePayrollSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid payroll update', result.error);
  }
  return result.data;
}

export function validateOnlineBookingUpdate(
  data: unknown
): z.infer<typeof UpdateOnlineBookingSchema> {
  const result = UpdateOnlineBookingSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid online booking update', result.error);
  }
  return result.data;
}

export function validateNotificationsUpdate(
  data: unknown
): z.infer<typeof UpdateNotificationsSchema> {
  const result = UpdateNotificationsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid notifications update', result.error);
  }
  return result.data;
}

export function validatePerformanceGoalsUpdate(
  data: unknown
): z.infer<typeof UpdatePerformanceGoalsSchema> {
  const result = UpdatePerformanceGoalsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid performance goals update', result.error);
  }
  return result.data;
}

// ============================================
// STANDALONE ENTITY VALIDATORS
// ============================================

export function validateTimeOffRequest(
  data: unknown
): z.infer<typeof TimeOffRequestSchema> {
  const result = TimeOffRequestSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid time off request', result.error);
  }
  return result.data;
}

export function validateScheduleOverride(
  data: unknown
): z.infer<typeof ScheduleOverrideSchema> {
  const result = ScheduleOverrideSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid schedule override', result.error);
  }
  return result.data;
}

// ============================================
// UTILITY VALIDATORS
// ============================================

/**
 * Check if data is valid without throwing.
 */
export function isValidTeamMemberSettings(data: unknown): data is TeamMemberSettingsType {
  return TeamMemberSettingsSchema.safeParse(data).success;
}

export function isValidProfile(data: unknown): data is TeamMemberProfileType {
  return TeamMemberProfileSchema.safeParse(data).success;
}

export function isValidCommission(data: unknown): data is CommissionSettingsType {
  return CommissionSettingsSchema.safeParse(data).success;
}

/**
 * Validate PIN format (4-6 digits).
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * Validate time format (HH:mm).
 */
export function isValidTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}
