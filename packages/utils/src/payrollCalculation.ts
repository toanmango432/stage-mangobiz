/**
 * Payroll Calculation Engine - Phase 3: Payroll & Pay Runs
 *
 * Core calculation logic for pay runs. Uses CommissionSettings and PayrollSettings
 * from team-settings to calculate staff earnings.
 *
 * @see docs/product/PRD-Team-Module.md Section 6.6
 * @see src/components/team-settings/types.ts for CommissionSettings, PayrollSettings
 */

import type {
  PayRunHoursBreakdown,
  PayRunCommissionBreakdown,
  CalculatedPayData,
  StaffPayment,
} from '../types/payroll';
import {
  createEmptyHoursBreakdown,
  createEmptyCommissionBreakdown,
} from '../types/payroll';
import type { TimesheetEntry, OvertimeSettings } from '../types/timesheet';
import type { CommissionSettings, PayrollSettings, CommissionTier } from '../components/team-settings/types';

// ============================================
// HOURS CALCULATION
// ============================================

/**
 * Calculate hours breakdown from approved timesheets.
 */
export function calculateHoursFromTimesheets(
  timesheets: TimesheetEntry[],
  overtimeSettings: OvertimeSettings
): PayRunHoursBreakdown {
  const hours = createEmptyHoursBreakdown();

  for (const ts of timesheets) {
    if (ts.status !== 'approved') continue;

    hours.scheduledHours += ts.hours.scheduledHours;
    hours.actualHours += ts.hours.actualHours;
    hours.unpaidBreakMinutes += ts.hours.unpaidBreakMinutes;
  }

  // Calculate overtime based on settings
  const { regularHours, overtimeHours, doubleTimeHours } = calculateOvertimeBreakdown(
    hours.actualHours,
    overtimeSettings
  );

  hours.regularHours = regularHours;
  hours.overtimeHours = overtimeHours;
  hours.doubleTimeHours = doubleTimeHours;

  return hours;
}

/**
 * Calculate overtime breakdown based on settings.
 */
export function calculateOvertimeBreakdown(
  totalHours: number,
  settings: OvertimeSettings
): { regularHours: number; overtimeHours: number; doubleTimeHours: number } {
  let regularHours = 0;
  let overtimeHours = 0;
  let doubleTimeHours = 0;

  const weeklyThreshold = settings.weeklyThreshold || 40;
  const doubleTimeThreshold = settings.doubleTimeThreshold || 60;

  if (totalHours <= weeklyThreshold) {
    // All regular
    regularHours = totalHours;
  } else if (totalHours <= doubleTimeThreshold) {
    // Regular + OT
    regularHours = weeklyThreshold;
    overtimeHours = totalHours - weeklyThreshold;
  } else {
    // Regular + OT + Double Time
    regularHours = weeklyThreshold;
    overtimeHours = doubleTimeThreshold - weeklyThreshold;
    doubleTimeHours = totalHours - doubleTimeThreshold;
  }

  return { regularHours, overtimeHours, doubleTimeHours };
}

/**
 * Calculate wages from hours and payroll settings.
 */
export function calculateWages(
  hours: PayRunHoursBreakdown,
  payroll: PayrollSettings
): { baseWages: number; overtimePay: number; doubleTimePay: number; totalWages: number } {
  const hourlyRate = payroll.hourlyRate || 0;
  const overtimeRate = payroll.overtimeRate || 1.5;
  const doubleTimeRate = 2.0; // Standard double-time

  const baseWages = hours.regularHours * hourlyRate;
  const overtimePay = hours.overtimeHours * hourlyRate * overtimeRate;
  const doubleTimePay = hours.doubleTimeHours * hourlyRate * doubleTimeRate;

  // If base salary is set, use it instead of hourly calculation
  let totalWages = baseWages + overtimePay + doubleTimePay;
  if (payroll.baseSalary && payroll.baseSalary > 0) {
    // Base salary replaces base wages, but keep OT
    totalWages = payroll.baseSalary + overtimePay + doubleTimePay;
  }

  return {
    baseWages: payroll.baseSalary || baseWages,
    overtimePay,
    doubleTimePay,
    totalWages,
  };
}

// ============================================
// COMMISSION CALCULATION
// ============================================

/**
 * Calculate service commission based on commission type.
 */
export function calculateServiceCommission(
  serviceRevenue: number,
  commission: CommissionSettings
): number {
  switch (commission.type) {
    case 'none':
      return 0;

    case 'flat':
      return commission.flatAmount || 0;

    case 'percentage':
      return serviceRevenue * (commission.basePercentage / 100);

    case 'tiered':
      return calculateTieredCommission(serviceRevenue, commission.tiers || []);

    default:
      return 0;
  }
}

/**
 * Calculate tiered commission based on revenue thresholds.
 */
export function calculateTieredCommission(
  revenue: number,
  tiers: CommissionTier[]
): number {
  if (tiers.length === 0) return 0;

  // Sort tiers by minRevenue
  const sortedTiers = [...tiers].sort((a, b) => a.minRevenue - b.minRevenue);

  let totalCommission = 0;
  let remainingRevenue = revenue;

  for (const tier of sortedTiers) {
    if (remainingRevenue <= 0) break;

    const tierMin = tier.minRevenue;
    const tierMax = tier.maxRevenue ?? Infinity;

    // Calculate revenue in this tier
    const tierRange = tierMax - tierMin;
    const revenueInTier = Math.min(remainingRevenue, tierRange > 0 ? tierRange : remainingRevenue);

    // Add commission for this tier
    totalCommission += revenueInTier * (tier.percentage / 100);
    remainingRevenue -= revenueInTier;
  }

  return totalCommission;
}

/**
 * Calculate commission breakdown from transaction data.
 *
 * @param data Transaction data for the pay period
 * @param commission Commission settings for the staff member
 */
export function calculateCommissionBreakdown(
  data: {
    serviceRevenue: number;
    productRevenue: number;
    retailRevenue: number;
    newClientCount: number;
    rebookCount: number;
    tipsReceived: number;
  },
  commission: CommissionSettings
): PayRunCommissionBreakdown {
  const breakdown = createEmptyCommissionBreakdown();

  // Service revenue and commission
  breakdown.serviceRevenue = data.serviceRevenue;
  breakdown.serviceCommission = calculateServiceCommission(data.serviceRevenue, commission);

  // Product commission
  breakdown.productRevenue = data.productRevenue;
  breakdown.productCommission = data.productRevenue * ((commission.productCommission || 0) / 100);

  // Retail commission
  breakdown.retailRevenue = data.retailRevenue;
  breakdown.retailCommission = data.retailRevenue * ((commission.retailCommission || 0) / 100);

  // New client bonus
  breakdown.newClientCount = data.newClientCount;
  breakdown.newClientBonus = data.newClientCount * (commission.newClientBonus || 0);

  // Rebook bonus
  breakdown.rebookCount = data.rebookCount;
  breakdown.rebookBonus = data.rebookCount * (commission.rebookBonus || 0);

  // Tips
  breakdown.tipsReceived = data.tipsReceived;
  breakdown.tipsKept = calculateTipsKept(data.tipsReceived, commission);

  return breakdown;
}

/**
 * Calculate tips kept after house percentage.
 */
export function calculateTipsKept(
  tipsReceived: number,
  commission: CommissionSettings
): number {
  switch (commission.tipHandling) {
    case 'keep_all':
      return tipsReceived;

    case 'pool':
      // In pool mode, tips are redistributed separately
      // Return 0 here - actual distribution is handled elsewhere
      return 0;

    case 'percentage':
      const housePercent = commission.tipPercentageToHouse || 0;
      return tipsReceived * ((100 - housePercent) / 100);

    default:
      return tipsReceived;
  }
}

/**
 * Calculate total commission from breakdown.
 */
export function calculateTotalCommission(breakdown: PayRunCommissionBreakdown): number {
  return (
    breakdown.serviceCommission +
    breakdown.productCommission +
    breakdown.retailCommission +
    breakdown.newClientBonus +
    breakdown.rebookBonus
  );
}

// ============================================
// COMPLETE PAY CALCULATION
// ============================================

/**
 * Calculate complete pay data for a staff member.
 *
 * @param staffId Staff member ID
 * @param staffName Staff member display name
 * @param staffRole Staff member role
 * @param timesheets Approved timesheets for the pay period
 * @param transactionData Transaction data for commission calculation
 * @param commission Commission settings from team-settings
 * @param payroll Payroll settings from team-settings
 * @param overtimeSettings Overtime settings (store-level)
 */
export function calculateStaffPay(
  staffId: string,
  staffName: string,
  staffRole: string,
  timesheets: TimesheetEntry[],
  transactionData: {
    serviceRevenue: number;
    productRevenue: number;
    retailRevenue: number;
    newClientCount: number;
    rebookCount: number;
    tipsReceived: number;
  },
  commission: CommissionSettings,
  payroll: PayrollSettings,
  overtimeSettings: OvertimeSettings
): CalculatedPayData {
  // Calculate hours
  const hours = calculateHoursFromTimesheets(timesheets, overtimeSettings);

  // Calculate wages
  const wages = calculateWages(hours, payroll);

  // Calculate commission
  const commissionBreakdown = calculateCommissionBreakdown(transactionData, commission);
  const totalCommission = calculateTotalCommission(commissionBreakdown);

  // Tips (already calculated in commission breakdown)
  const totalTips = commissionBreakdown.tipsKept;

  // Calculate gross pay
  const grossPay = wages.totalWages + totalCommission + totalTips;

  // Apply guaranteed minimum
  const guaranteedMinimum = payroll.guaranteedMinimum || 0;
  const netPay = Math.max(grossPay, guaranteedMinimum);

  return {
    staffId,
    staffName,
    staffRole,
    hours,
    hourlyRate: payroll.hourlyRate || 0,
    baseWages: wages.baseWages,
    overtimePay: wages.overtimePay,
    doubleTimePay: wages.doubleTimePay,
    totalWages: wages.totalWages,
    commission: commissionBreakdown,
    totalCommission,
    totalTips,
    grossPay,
    guaranteedMinimum,
    netPay,
  };
}

/**
 * Convert calculated pay data to a StaffPayment object.
 */
export function toStaffPayment(
  calculatedData: CalculatedPayData,
  paymentMethod: 'direct_deposit' | 'check' | 'cash' | 'external' = 'direct_deposit'
): StaffPayment {
  return {
    ...calculatedData,
    adjustments: [],
    totalAdjustments: 0,
    paymentMethod,
    isPaid: false,
  };
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format currency for display.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format hours for display.
 */
export function formatHoursDisplay(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Format pay period for display.
 */
export function formatPayPeriod(periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', { ...options, year: 'numeric' });

  return `${startStr} - ${endStr}`;
}

/**
 * Get pay period dates for a given type.
 */
export function getPayPeriodDates(
  type: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly',
  referenceDate: Date = new Date()
): { periodStart: string; periodEnd: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let start: Date;
  let end: Date;

  switch (type) {
    case 'weekly':
      // Week starts on Monday
      const dayOfWeek = referenceDate.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(year, month, day - daysFromMonday);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;

    case 'bi-weekly':
      // Two weeks ending on the nearest Sunday
      const biWeekDayOfWeek = referenceDate.getDay();
      const daysToSunday = biWeekDayOfWeek === 0 ? 0 : 7 - biWeekDayOfWeek;
      end = new Date(year, month, day + daysToSunday);
      start = new Date(end);
      start.setDate(end.getDate() - 13);
      break;

    case 'semi-monthly':
      // 1st-15th or 16th-end of month
      if (day <= 15) {
        start = new Date(year, month, 1);
        end = new Date(year, month, 15);
      } else {
        start = new Date(year, month, 16);
        end = new Date(year, month + 1, 0); // Last day of month
      }
      break;

    case 'monthly':
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0); // Last day of month
      break;

    default:
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0);
  }

  return {
    periodStart: start.toISOString().split('T')[0],
    periodEnd: end.toISOString().split('T')[0],
  };
}
