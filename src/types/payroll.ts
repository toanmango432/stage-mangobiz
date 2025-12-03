/**
 * Payroll Types - Phase 3: Payroll & Pay Runs
 *
 * Provides types for pay run creation, calculation, approval workflow,
 * and payment processing. Uses existing CommissionSettings and PayrollSettings
 * from team-settings for per-staff configuration.
 *
 * @see docs/product/PRD-Team-Module.md Section 6.6
 * @see src/components/team-settings/types.ts for CommissionSettings, PayrollSettings
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/**
 * Status of a pay run in the approval workflow.
 */
export type PayRunStatus = 'draft' | 'pending_approval' | 'approved' | 'processed' | 'voided';

/**
 * How payment is delivered to the staff member.
 */
export type PaymentMethod = 'direct_deposit' | 'check' | 'cash' | 'external';

/**
 * Types of adjustments that can be added to a pay run.
 */
export type AdjustmentType =
  | 'bonus'           // Manual bonus payment
  | 'reimbursement'   // Expense reimbursement
  | 'tip_adjustment'  // Tip correction (not captured at checkout)
  | 'advance'         // Cash advance repayment (negative)
  | 'fee'             // Processing fee pass-through (negative)
  | 'supply'          // Product/supply cost deduction (negative)
  | 'tax'             // Tax withholding (negative)
  | 'benefits'        // Health, retirement deductions (negative)
  | 'other';          // Custom adjustment

/**
 * Pay period type for pay runs.
 */
export type PayPeriodType = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

// ============================================
// ADJUSTMENT TYPES
// ============================================

/**
 * A single adjustment entry for a staff member's pay.
 */
export interface PayRunAdjustment {
  /** Unique identifier for this adjustment */
  id: string;

  /** Type of adjustment */
  type: AdjustmentType;

  /** Amount (positive for additions, negative for deductions) */
  amount: number;

  /** Description/reason for adjustment */
  description: string;

  /** Who added this adjustment */
  addedBy: string;

  /** When this adjustment was added */
  addedAt: string;
}

// ============================================
// STAFF PAYMENT BREAKDOWN
// ============================================

/**
 * Hours breakdown for a staff member in a pay period.
 */
export interface PayRunHoursBreakdown {
  /** Total scheduled hours */
  scheduledHours: number;

  /** Total actual hours worked */
  actualHours: number;

  /** Regular (non-overtime) hours */
  regularHours: number;

  /** Overtime hours (over threshold) */
  overtimeHours: number;

  /** Double-time hours (if applicable) */
  doubleTimeHours: number;

  /** Total break minutes (unpaid) */
  unpaidBreakMinutes: number;
}

/**
 * Commission breakdown for a staff member in a pay period.
 */
export interface PayRunCommissionBreakdown {
  /** Revenue from services */
  serviceRevenue: number;

  /** Commission earned on services */
  serviceCommission: number;

  /** Revenue from product sales */
  productRevenue: number;

  /** Commission earned on products */
  productCommission: number;

  /** Revenue from retail sales */
  retailRevenue: number;

  /** Commission earned on retail */
  retailCommission: number;

  /** Number of new clients served */
  newClientCount: number;

  /** Bonus earned for new clients */
  newClientBonus: number;

  /** Number of rebookings */
  rebookCount: number;

  /** Bonus earned for rebookings */
  rebookBonus: number;

  /** Total tips received */
  tipsReceived: number;

  /** Tips kept (after house percentage if applicable) */
  tipsKept: number;
}

/**
 * Complete payment details for a single staff member in a pay run.
 */
export interface StaffPayment {
  /** Staff member ID */
  staffId: string;

  /** Staff member name (denormalized for display) */
  staffName: string;

  /** Staff member role */
  staffRole: string;

  // ---- Hours & Wages ----

  /** Hours breakdown */
  hours: PayRunHoursBreakdown;

  /** Hourly rate used for calculation */
  hourlyRate: number;

  /** Base wages (regular hours × rate) */
  baseWages: number;

  /** Overtime pay */
  overtimePay: number;

  /** Double-time pay */
  doubleTimePay: number;

  /** Total wages (base + OT + double-time) */
  totalWages: number;

  // ---- Commission ----

  /** Commission breakdown */
  commission: PayRunCommissionBreakdown;

  /** Total commission earned */
  totalCommission: number;

  // ---- Tips ----

  /** Total tips kept */
  totalTips: number;

  // ---- Adjustments ----

  /** List of adjustments */
  adjustments: PayRunAdjustment[];

  /** Total of all adjustments */
  totalAdjustments: number;

  // ---- Totals ----

  /** Gross pay (wages + commission + tips + adjustments) */
  grossPay: number;

  /** Guaranteed minimum (if applicable) */
  guaranteedMinimum: number;

  /** Final pay (max of gross and guaranteed) */
  netPay: number;

  // ---- Payment ----

  /** How this staff member will be paid */
  paymentMethod: PaymentMethod;

  /** Whether payment has been made */
  isPaid: boolean;

  /** When payment was made */
  paidAt?: string;

  /** Payment reference (check number, transaction ID, etc.) */
  paymentReference?: string;
}

// ============================================
// PAY RUN TOTALS
// ============================================

/**
 * Aggregate totals for an entire pay run.
 */
export interface PayRunTotals {
  /** Number of staff included */
  staffCount: number;

  /** Total hours worked (all staff) */
  totalHours: number;

  /** Total overtime hours (all staff) */
  totalOvertimeHours: number;

  /** Total wages (all staff) */
  totalWages: number;

  /** Total commission (all staff) */
  totalCommission: number;

  /** Total tips (all staff) */
  totalTips: number;

  /** Total adjustments (all staff) */
  totalAdjustments: number;

  /** Grand total (all staff gross pay) */
  grandTotal: number;

  /** Number of staff paid */
  paidCount: number;

  /** Total amount paid out */
  totalPaid: number;

  /** Total amount pending */
  totalPending: number;
}

// ============================================
// PAY RUN ENTITY
// ============================================

/**
 * A pay run represents a batch payment processing for a pay period.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface PayRun extends BaseSyncableEntity {
  /** Pay period start date (YYYY-MM-DD) */
  periodStart: string;

  /** Pay period end date (YYYY-MM-DD) */
  periodEnd: string;

  /** Pay period type */
  periodType: PayPeriodType;

  /** Current status in workflow */
  status: PayRunStatus;

  /** Individual staff payments */
  staffPayments: StaffPayment[];

  /** Aggregate totals */
  totals: PayRunTotals;

  // ---- Approval Workflow ----

  /** When pay run was submitted for approval */
  submittedAt?: string;

  /** Who submitted for approval */
  submittedBy?: string;

  /** When pay run was approved */
  approvedAt?: string;

  /** Who approved the pay run */
  approvedBy?: string;

  /** Manager notes on approval */
  approvalNotes?: string;

  // ---- Processing ----

  /** When pay run was processed */
  processedAt?: string;

  /** Who processed the pay run */
  processedBy?: string;

  /** Processing notes */
  processingNotes?: string;

  // ---- Voiding ----

  /** When pay run was voided */
  voidedAt?: string;

  /** Who voided the pay run */
  voidedBy?: string;

  /** Reason for voiding */
  voidReason?: string;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Parameters for creating a new pay run.
 */
export interface CreatePayRunParams {
  periodStart: string;
  periodEnd: string;
  periodType: PayPeriodType;
  staffIds?: string[]; // If empty, includes all active staff
}

/**
 * Parameters for adding an adjustment.
 */
export interface AddAdjustmentParams {
  payRunId: string;
  staffId: string;
  type: AdjustmentType;
  amount: number;
  description: string;
}

/**
 * Calculated pay data before it's saved to a pay run.
 */
export interface CalculatedPayData {
  staffId: string;
  staffName: string;
  staffRole: string;
  hours: PayRunHoursBreakdown;
  hourlyRate: number;
  baseWages: number;
  overtimePay: number;
  doubleTimePay: number;
  totalWages: number;
  commission: PayRunCommissionBreakdown;
  totalCommission: number;
  totalTips: number;
  grossPay: number;
  guaranteedMinimum: number;
  netPay: number;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Creates empty hours breakdown with all zeros.
 */
export function createEmptyHoursBreakdown(): PayRunHoursBreakdown {
  return {
    scheduledHours: 0,
    actualHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    doubleTimeHours: 0,
    unpaidBreakMinutes: 0,
  };
}

/**
 * Creates empty commission breakdown with all zeros.
 */
export function createEmptyCommissionBreakdown(): PayRunCommissionBreakdown {
  return {
    serviceRevenue: 0,
    serviceCommission: 0,
    productRevenue: 0,
    productCommission: 0,
    retailRevenue: 0,
    retailCommission: 0,
    newClientCount: 0,
    newClientBonus: 0,
    rebookCount: 0,
    rebookBonus: 0,
    tipsReceived: 0,
    tipsKept: 0,
  };
}

/**
 * Creates empty pay run totals.
 */
export function createEmptyTotals(): PayRunTotals {
  return {
    staffCount: 0,
    totalHours: 0,
    totalOvertimeHours: 0,
    totalWages: 0,
    totalCommission: 0,
    totalTips: 0,
    totalAdjustments: 0,
    grandTotal: 0,
    paidCount: 0,
    totalPaid: 0,
    totalPending: 0,
  };
}

/**
 * Creates a default staff payment object.
 */
export function createDefaultStaffPayment(
  staffId: string,
  staffName: string,
  staffRole: string
): StaffPayment {
  return {
    staffId,
    staffName,
    staffRole,
    hours: createEmptyHoursBreakdown(),
    hourlyRate: 0,
    baseWages: 0,
    overtimePay: 0,
    doubleTimePay: 0,
    totalWages: 0,
    commission: createEmptyCommissionBreakdown(),
    totalCommission: 0,
    totalTips: 0,
    adjustments: [],
    totalAdjustments: 0,
    grossPay: 0,
    guaranteedMinimum: 0,
    netPay: 0,
    paymentMethod: 'direct_deposit',
    isPaid: false,
  };
}

/**
 * Calculates totals from staff payments array.
 */
export function calculatePayRunTotals(staffPayments: StaffPayment[]): PayRunTotals {
  const totals = createEmptyTotals();

  totals.staffCount = staffPayments.length;

  for (const payment of staffPayments) {
    totals.totalHours += payment.hours.actualHours;
    totals.totalOvertimeHours += payment.hours.overtimeHours;
    totals.totalWages += payment.totalWages;
    totals.totalCommission += payment.totalCommission;
    totals.totalTips += payment.totalTips;
    totals.totalAdjustments += payment.totalAdjustments;
    totals.grandTotal += payment.netPay;

    if (payment.isPaid) {
      totals.paidCount += 1;
      totals.totalPaid += payment.netPay;
    } else {
      totals.totalPending += payment.netPay;
    }
  }

  return totals;
}

/**
 * Gets status display info.
 */
export function getPayRunStatusInfo(status: PayRunStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'draft':
      return { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'pending_approval':
      return { label: 'Pending Approval', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'approved':
      return { label: 'Approved', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'processed':
      return { label: 'Processed', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'voided':
      return { label: 'Voided', color: 'text-red-700', bgColor: 'bg-red-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Gets adjustment type display info.
 */
export function getAdjustmentTypeInfo(type: AdjustmentType): {
  label: string;
  isDeduction: boolean;
} {
  switch (type) {
    case 'bonus':
      return { label: 'Bonus', isDeduction: false };
    case 'reimbursement':
      return { label: 'Reimbursement', isDeduction: false };
    case 'tip_adjustment':
      return { label: 'Tip Adjustment', isDeduction: false };
    case 'advance':
      return { label: 'Advance Repayment', isDeduction: true };
    case 'fee':
      return { label: 'Processing Fee', isDeduction: true };
    case 'supply':
      return { label: 'Supply Cost', isDeduction: true };
    case 'tax':
      return { label: 'Tax Withholding', isDeduction: true };
    case 'benefits':
      return { label: 'Benefits', isDeduction: true };
    case 'other':
      return { label: 'Other', isDeduction: false };
    default:
      return { label: 'Unknown', isDeduction: false };
  }
}
