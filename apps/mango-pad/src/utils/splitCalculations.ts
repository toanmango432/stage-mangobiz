/**
 * Split Payment Calculation Utilities
 * US-010: Math utilities for split payment calculations
 */

export interface SplitAmount {
  index: number;
  amount: number;
}

/**
 * Calculate equal split amounts for a total
 * Handles rounding by adding remainder to first split
 */
export function calculateEqualSplits(total: number, numberOfSplits: number): SplitAmount[] {
  if (numberOfSplits < 2 || numberOfSplits > 4) {
    throw new Error('Number of splits must be between 2 and 4');
  }

  const baseAmount = Math.floor((total * 100) / numberOfSplits) / 100;
  const remainder = Math.round((total - baseAmount * numberOfSplits) * 100) / 100;

  return Array.from({ length: numberOfSplits }, (_, index) => ({
    index,
    amount: index === 0 ? baseAmount + remainder : baseAmount,
  }));
}

/**
 * Validate that custom split amounts equal the total
 */
export function validateSplitAmounts(amounts: number[], total: number): {
  isValid: boolean;
  difference: number;
} {
  const sum = amounts.reduce((acc, amount) => acc + amount, 0);
  const difference = Math.round((total - sum) * 100) / 100;
  
  return {
    isValid: Math.abs(difference) < 0.01,
    difference,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get default custom split amounts (divides equally by default)
 */
export function getDefaultCustomSplits(total: number, numberOfSplits: number): number[] {
  const splits = calculateEqualSplits(total, numberOfSplits);
  return splits.map((s) => s.amount);
}

/**
 * Adjust the last split amount to ensure total matches
 */
export function adjustLastSplit(amounts: number[], total: number): number[] {
  if (amounts.length === 0) return amounts;
  
  const sumExceptLast = amounts.slice(0, -1).reduce((acc, a) => acc + a, 0);
  const adjustedLast = Math.round((total - sumExceptLast) * 100) / 100;
  
  return [...amounts.slice(0, -1), Math.max(0, adjustedLast)];
}
