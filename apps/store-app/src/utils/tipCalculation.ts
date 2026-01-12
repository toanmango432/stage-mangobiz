/**
 * Tip Calculation Utilities
 *
 * Functions for calculating and distributing tips among staff members.
 */

export interface StaffMember {
  id: string;
  name: string;
  serviceTotal?: number;
}

export interface TipDistribution {
  staffId: string;
  staffName: string;
  amount: number;
  percentage?: number;
}

/**
 * Calculate proportional tip distribution based on service revenue.
 * Each staff member receives a tip proportional to their service revenue.
 *
 * @param tipAmount - Total tip amount to distribute
 * @param staffMembers - List of staff members with their service totals
 * @returns Array of tip distributions
 */
export function calculateProportionalDistribution(
  tipAmount: number,
  staffMembers: StaffMember[]
): TipDistribution[] {
  if (staffMembers.length === 0 || tipAmount === 0) {
    return [];
  }

  const totalServiceRevenue = staffMembers.reduce(
    (sum, s) => sum + (s.serviceTotal || 0),
    0
  );

  // Fall back to equal split if no service revenue
  if (totalServiceRevenue === 0) {
    return calculateEqualDistribution(tipAmount, staffMembers);
  }

  return staffMembers.map((staff) => {
    const proportion = (staff.serviceTotal || 0) / totalServiceRevenue;
    return {
      staffId: staff.id,
      staffName: staff.name,
      amount: Math.round(tipAmount * proportion * 100) / 100, // Round to cents
      percentage: Math.round(proportion * 10000) / 100, // Round to 2 decimal places
    };
  });
}

/**
 * Calculate equal tip distribution among all staff members.
 *
 * @param tipAmount - Total tip amount to distribute
 * @param staffMembers - List of staff members
 * @returns Array of tip distributions
 */
export function calculateEqualDistribution(
  tipAmount: number,
  staffMembers: StaffMember[]
): TipDistribution[] {
  if (staffMembers.length === 0 || tipAmount === 0) {
    return [];
  }

  const amountPerStaff = Math.round((tipAmount / staffMembers.length) * 100) / 100;
  const percentagePerStaff = Math.round((100 / staffMembers.length) * 100) / 100;

  return staffMembers.map((staff) => ({
    staffId: staff.id,
    staffName: staff.name,
    amount: amountPerStaff,
    percentage: percentagePerStaff,
  }));
}

/**
 * Calculate tip amount from percentage.
 *
 * @param subtotal - The subtotal before tip
 * @param percentage - Tip percentage (e.g., 20 for 20%)
 * @param preTax - Whether to calculate tip before or after tax
 * @param taxAmount - Tax amount (if calculating post-tax)
 * @returns Calculated tip amount
 */
export function calculateTipFromPercentage(
  subtotal: number,
  percentage: number,
  preTax: boolean = true,
  taxAmount: number = 0
): number {
  const baseAmount = preTax ? subtotal : subtotal + taxAmount;
  return Math.round((baseAmount * percentage / 100) * 100) / 100;
}

/**
 * Calculate suggested tip amounts for display.
 *
 * @param subtotal - The subtotal before tip
 * @param percentages - Array of suggested percentages (e.g., [15, 18, 20, 22])
 * @param preTax - Whether to calculate tip before or after tax
 * @param taxAmount - Tax amount (if calculating post-tax)
 * @returns Array of objects with percentage and amount
 */
export function calculateTipSuggestions(
  subtotal: number,
  percentages: number[] = [15, 18, 20, 22],
  preTax: boolean = true,
  taxAmount: number = 0
): Array<{ percentage: number; amount: number }> {
  return percentages.map((percentage) => ({
    percentage,
    amount: calculateTipFromPercentage(subtotal, percentage, preTax, taxAmount),
  }));
}

/**
 * Validate and adjust tip distribution to ensure total equals tip amount.
 * Handles rounding errors by adjusting the first staff member's amount.
 *
 * @param distribution - Array of tip distributions
 * @param totalTip - Expected total tip amount
 * @returns Adjusted distribution
 */
export function adjustForRounding(
  distribution: TipDistribution[],
  totalTip: number
): TipDistribution[] {
  if (distribution.length === 0) return distribution;

  const currentTotal = distribution.reduce((sum, d) => sum + d.amount, 0);
  const difference = Math.round((totalTip - currentTotal) * 100) / 100;

  if (difference === 0) return distribution;

  // Adjust the first staff member's amount to compensate for rounding
  const adjusted = [...distribution];
  adjusted[0] = {
    ...adjusted[0],
    amount: Math.round((adjusted[0].amount + difference) * 100) / 100,
  };

  return adjusted;
}
