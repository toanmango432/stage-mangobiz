import { BaseSyncableEntity } from '../common';

/**
 * TimeOffType defines a category of time-off (Vacation, Sick, Personal, etc.)
 * These are configurable per store and used when creating time-off requests.
 */
export interface TimeOffType extends BaseSyncableEntity {
  // === IDENTITY ===
  /** Display name shown in UI: "Vacation", "Sick Leave" */
  name: string;

  /** Short code for reports/exports: "VAC", "SICK" */
  code: string;

  // === VISUAL ===
  /** Emoji for quick visual identification */
  emoji: string;

  /** Hex color for calendar display: "#10B981" */
  color: string;

  // === CONFIGURATION ===
  /** Whether this time counts as paid time for payroll */
  isPaid: boolean;

  /** Whether manager approval is required (false = auto-approve) */
  requiresApproval: boolean;

  // === LIMITS (Optional) ===
  /** Maximum days per year (null = unlimited) */
  annualLimitDays: number | null;

  /** Whether days accrue over time */
  accrualEnabled: boolean;

  /** Days accrued per month when accrual enabled */
  accrualRatePerMonth: number | null;

  /** Whether unused days carry over to next year */
  carryOverEnabled: boolean;

  /** Maximum days that can carry over */
  maxCarryOverDays: number | null;

  // === DISPLAY ===
  /** Sort order in dropdowns/lists (lower = first) */
  displayOrder: number;

  /** Whether this type is available for selection */
  isActive: boolean;

  /** Whether this is a system-provided default type */
  isSystemDefault: boolean;
}

/**
 * Input for creating a new TimeOffType
 */
export interface CreateTimeOffTypeInput {
  name: string;
  code: string;
  emoji: string;
  color: string;
  isPaid: boolean;
  requiresApproval: boolean;
  annualLimitDays?: number | null;
  accrualEnabled?: boolean;
  accrualRatePerMonth?: number | null;
  carryOverEnabled?: boolean;
  maxCarryOverDays?: number | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Input for updating an existing TimeOffType
 */
export type UpdateTimeOffTypeInput = Partial<Omit<CreateTimeOffTypeInput, 'code'>>;
