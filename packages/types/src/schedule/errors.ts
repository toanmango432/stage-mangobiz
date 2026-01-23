/**
 * Schedule Module Error Types
 * Custom error classes for proper error handling and type checking
 */

export type ScheduleErrorCode =
  | 'TIME_OFF_TYPE_NOT_FOUND'
  | 'TIME_OFF_REQUEST_NOT_FOUND'
  | 'CANNOT_DELETE_SYSTEM_DEFAULT'
  | 'REQUEST_NOT_PENDING'
  | 'DENIAL_REASON_REQUIRED'
  | 'CONFLICT_EXISTS'
  | 'INSUFFICIENT_BALANCE'
  | 'DATE_RANGE_INVALID'
  | 'STAFF_NOT_FOUND'
  | 'BLOCKED_TIME_TYPE_NOT_FOUND'
  | 'BLOCKED_TIME_ENTRY_NOT_FOUND'
  | 'CANNOT_DELETE_DEFAULT_BLOCKED_TIME_TYPE'
  | 'BLOCKED_TIME_TYPE_IN_USE'
  | 'DUPLICATE_BLOCKED_TIME_TYPE_CODE'
  | 'BLOCKED_TIME_CONFLICT'
  | 'INVALID_RECURRENCE_CONFIG'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_BOOKING_CONFLICT'
  | 'STAFF_SCHEDULE_NOT_FOUND'
  | 'UNAUTHORIZED';

/**
 * Base error for all schedule operations
 */
export class ScheduleError extends Error {
  constructor(
    message: string,
    public readonly code: ScheduleErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ScheduleError';
    // Maintains proper stack trace for where error was thrown (V8 engines only)
    const captureStackTrace = (Error as unknown as { captureStackTrace?: (target: object, ctor?: Function) => void }).captureStackTrace;
    if (captureStackTrace) {
      captureStackTrace(this, ScheduleError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

// ==================== TIME-OFF ERRORS ====================

export class TimeOffTypeNotFoundError extends ScheduleError {
  constructor(typeId: string) {
    super(
      `Time-off type not found: ${typeId}`,
      'TIME_OFF_TYPE_NOT_FOUND',
      { typeId }
    );
    this.name = 'TimeOffTypeNotFoundError';
  }
}

export class TimeOffRequestNotFoundError extends ScheduleError {
  constructor(requestId: string) {
    super(
      `Time-off request not found: ${requestId}`,
      'TIME_OFF_REQUEST_NOT_FOUND',
      { requestId }
    );
    this.name = 'TimeOffRequestNotFoundError';
  }
}

export class CannotDeleteSystemDefaultError extends ScheduleError {
  constructor(typeId: string, typeName: string) {
    super(
      `Cannot delete system default type: ${typeName}`,
      'CANNOT_DELETE_SYSTEM_DEFAULT',
      { typeId, typeName }
    );
    this.name = 'CannotDeleteSystemDefaultError';
  }
}

export class RequestNotPendingError extends ScheduleError {
  constructor(requestId: string, currentStatus: string) {
    super(
      `Request is not pending (current status: ${currentStatus})`,
      'REQUEST_NOT_PENDING',
      { requestId, currentStatus }
    );
    this.name = 'RequestNotPendingError';
  }
}

export class DenialReasonRequiredError extends ScheduleError {
  constructor() {
    super(
      'Denial reason is required',
      'DENIAL_REASON_REQUIRED'
    );
    this.name = 'DenialReasonRequiredError';
  }
}

export class ConflictExistsError extends ScheduleError {
  constructor(conflictingAppointmentIds: string[]) {
    super(
      `${conflictingAppointmentIds.length} conflicting appointment(s) exist`,
      'CONFLICT_EXISTS',
      { conflictingAppointmentIds, count: conflictingAppointmentIds.length }
    );
    this.name = 'ConflictExistsError';
  }
}

export class InsufficientBalanceError extends ScheduleError {
  constructor(requested: number, available: number, typeName: string) {
    super(
      `Insufficient ${typeName} balance: requested ${requested} days, available ${available} days`,
      'INSUFFICIENT_BALANCE',
      { requested, available, typeName }
    );
    this.name = 'InsufficientBalanceError';
  }
}

export class DateRangeInvalidError extends ScheduleError {
  constructor(startDate: string, endDate: string, reason?: string) {
    super(
      reason || `Invalid date range: ${startDate} to ${endDate}`,
      'DATE_RANGE_INVALID',
      { startDate, endDate, reason }
    );
    this.name = 'DateRangeInvalidError';
  }
}

// ==================== BLOCKED TIME ERRORS ====================

export class BlockedTimeTypeNotFoundError extends ScheduleError {
  constructor(typeId: string) {
    super(
      `Blocked time type not found: ${typeId}`,
      'BLOCKED_TIME_TYPE_NOT_FOUND',
      { typeId }
    );
    this.name = 'BlockedTimeTypeNotFoundError';
  }
}

export class BlockedTimeEntryNotFoundError extends ScheduleError {
  constructor(entryId: string) {
    super(
      `Blocked time entry not found: ${entryId}`,
      'BLOCKED_TIME_ENTRY_NOT_FOUND',
      { entryId }
    );
    this.name = 'BlockedTimeEntryNotFoundError';
  }
}

export class CannotDeleteDefaultBlockedTimeTypeError extends ScheduleError {
  constructor(typeName: string) {
    super(
      `Cannot delete system default blocked time type "${typeName}"`,
      'CANNOT_DELETE_DEFAULT_BLOCKED_TIME_TYPE',
      { typeName }
    );
    this.name = 'CannotDeleteDefaultBlockedTimeTypeError';
  }
}

export class BlockedTimeTypeInUseError extends ScheduleError {
  constructor(typeName: string, entryCount: number) {
    super(
      `Cannot delete "${typeName}": ${entryCount} blocked time entries use this type`,
      'BLOCKED_TIME_TYPE_IN_USE',
      { typeName, entryCount }
    );
    this.name = 'BlockedTimeTypeInUseError';
  }
}

export class DuplicateBlockedTimeTypeCodeError extends ScheduleError {
  constructor(code: string) {
    super(
      `Blocked time type with code "${code}" already exists`,
      'DUPLICATE_BLOCKED_TIME_TYPE_CODE',
      { code }
    );
    this.name = 'DuplicateBlockedTimeTypeCodeError';
  }
}

export class BlockedTimeConflictError extends ScheduleError {
  constructor(
    staffName: string,
    date: string,
    startTime: string,
    endTime: string,
    conflictingEntry: { typeName: string; startTime: string; endTime: string }
  ) {
    super(
      `${staffName} already has "${conflictingEntry.typeName}" blocked from ${conflictingEntry.startTime} to ${conflictingEntry.endTime} on ${date}`,
      'BLOCKED_TIME_CONFLICT',
      { staffName, date, startTime, endTime, conflictingEntry }
    );
    this.name = 'BlockedTimeConflictError';
  }
}

export class InvalidRecurrenceConfigError extends ScheduleError {
  constructor(message: string) {
    super(message, 'INVALID_RECURRENCE_CONFIG', {});
    this.name = 'InvalidRecurrenceConfigError';
  }
}

// ==================== RESOURCE ERRORS ====================

export class ResourceNotFoundError extends ScheduleError {
  constructor(resourceId: string) {
    super(
      `Resource not found: ${resourceId}`,
      'RESOURCE_NOT_FOUND',
      { resourceId }
    );
    this.name = 'ResourceNotFoundError';
  }
}

export class ResourceBookingConflictError extends ScheduleError {
  constructor(resourceId: string, resourceName: string, startTime: string, endTime: string) {
    super(
      `Resource "${resourceName}" is already booked from ${startTime} to ${endTime}`,
      'RESOURCE_BOOKING_CONFLICT',
      { resourceId, resourceName, startTime, endTime }
    );
    this.name = 'ResourceBookingConflictError';
  }
}

// ==================== STAFF ERRORS ====================

export class StaffNotFoundError extends ScheduleError {
  constructor(staffId: string) {
    super(
      `Staff member not found: ${staffId}`,
      'STAFF_NOT_FOUND',
      { staffId }
    );
    this.name = 'StaffNotFoundError';
  }
}

export class StaffScheduleNotFoundError extends ScheduleError {
  constructor(staffId: string) {
    super(
      `No schedule found for staff: ${staffId}`,
      'STAFF_SCHEDULE_NOT_FOUND',
      { staffId }
    );
    this.name = 'StaffScheduleNotFoundError';
  }
}

// ==================== AUTHORIZATION ERRORS ====================

export class UnauthorizedScheduleError extends ScheduleError {
  constructor(action: string, reason?: string) {
    super(
      reason || `Unauthorized to perform action: ${action}`,
      'UNAUTHORIZED',
      { action, reason }
    );
    this.name = 'UnauthorizedScheduleError';
  }
}

// ==================== TYPE GUARDS ====================

export function isScheduleError(error: unknown): error is ScheduleError {
  return error instanceof ScheduleError;
}

export function isTimeOffTypeNotFoundError(error: unknown): error is TimeOffTypeNotFoundError {
  return error instanceof TimeOffTypeNotFoundError;
}

export function isConflictExistsError(error: unknown): error is ConflictExistsError {
  return error instanceof ConflictExistsError;
}

export function isCannotDeleteSystemDefaultError(error: unknown): error is CannotDeleteSystemDefaultError {
  return error instanceof CannotDeleteSystemDefaultError;
}

export function isBlockedTimeTypeNotFoundError(error: unknown): error is BlockedTimeTypeNotFoundError {
  return error instanceof BlockedTimeTypeNotFoundError;
}

export function isBlockedTimeEntryNotFoundError(error: unknown): error is BlockedTimeEntryNotFoundError {
  return error instanceof BlockedTimeEntryNotFoundError;
}

export function isCannotDeleteDefaultBlockedTimeTypeError(error: unknown): error is CannotDeleteDefaultBlockedTimeTypeError {
  return error instanceof CannotDeleteDefaultBlockedTimeTypeError;
}

export function isBlockedTimeTypeInUseError(error: unknown): error is BlockedTimeTypeInUseError {
  return error instanceof BlockedTimeTypeInUseError;
}

export function isBlockedTimeConflictError(error: unknown): error is BlockedTimeConflictError {
  return error instanceof BlockedTimeConflictError;
}

export function isInvalidRecurrenceConfigError(error: unknown): error is InvalidRecurrenceConfigError {
  return error instanceof InvalidRecurrenceConfigError;
}
