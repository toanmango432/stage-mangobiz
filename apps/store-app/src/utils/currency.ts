/**
 * Currency utilities for safe monetary calculations
 * Handles floating-point precision issues common in JavaScript
 */

/**
 * Rounds a number to 2 decimal places (cents)
 * Uses Math.round to avoid floating-point precision issues
 * @param amount - The amount to round
 * @returns The amount rounded to 2 decimal places
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Adds multiple currency amounts safely
 * @param amounts - Array of amounts to add
 * @returns Sum rounded to 2 decimal places
 */
export function addAmounts(...amounts: number[]): number {
  const sum = amounts.reduce((total, amt) => total + (amt || 0), 0);
  return roundToCents(sum);
}

/**
 * Subtracts amount from base safely
 * @param base - The base amount
 * @param subtrahend - The amount to subtract
 * @returns Difference rounded to 2 decimal places
 */
export function subtractAmount(base: number, subtrahend: number): number {
  return roundToCents(base - subtrahend);
}

/**
 * Multiplies amount by a factor (e.g., for tax/tip percentages)
 * @param amount - The base amount
 * @param factor - The multiplier (e.g., 0.08 for 8% tax)
 * @returns Product rounded to 2 decimal places
 */
export function multiplyAmount(amount: number, factor: number): number {
  return roundToCents(amount * factor);
}

/**
 * Calculates percentage of an amount
 * @param amount - The base amount
 * @param percentage - The percentage (e.g., 15 for 15%)
 * @returns The percentage amount rounded to 2 decimal places
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return roundToCents((amount * percentage) / 100);
}

/**
 * Checks if two currency amounts are equal (within floating-point tolerance)
 * @param a - First amount
 * @param b - Second amount
 * @returns True if amounts are equal within 1 cent tolerance
 */
export function amountsEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

/**
 * Checks if an amount is fully paid (remaining <= 0.01)
 * @param paid - Amount paid
 * @param total - Total due
 * @returns True if fully paid
 */
export function isFullyPaid(paid: number, total: number): boolean {
  return paid > 0 && (total - paid) <= 0.01;
}
