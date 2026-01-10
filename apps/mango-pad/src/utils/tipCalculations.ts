/**
 * Tip Calculation Utilities
 * US-004: Math utilities for tip calculations
 */

export interface TipCalculationResult {
  tipAmount: number;
  tipPercent: number | null;
  total: number;
}

/**
 * Calculate tip amount based on suggestion value and type
 */
export function calculateTipAmount(
  baseTotal: number,
  suggestion: number,
  tipType: 'percentage' | 'dollar'
): number {
  if (tipType === 'percentage') {
    return Math.round((baseTotal * suggestion) / 100 * 100) / 100;
  }
  return suggestion;
}

/**
 * Calculate tip percentage from amount
 */
export function calculateTipPercent(
  baseTotal: number,
  tipAmount: number
): number | null {
  if (baseTotal <= 0) return null;
  return Math.round((tipAmount / baseTotal) * 100 * 10) / 10;
}

/**
 * Get full tip calculation result
 */
export function calculateTip(
  baseTotal: number,
  suggestion: number,
  tipType: 'percentage' | 'dollar'
): TipCalculationResult {
  const tipAmount = calculateTipAmount(baseTotal, suggestion, tipType);
  const tipPercent = tipType === 'percentage' ? suggestion : calculateTipPercent(baseTotal, tipAmount);
  const total = Math.round((baseTotal + tipAmount) * 100) / 100;

  return {
    tipAmount,
    tipPercent,
    total,
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
 * Validate tip amount (non-negative)
 */
export function validateTipAmount(amount: number): boolean {
  return amount >= 0 && Number.isFinite(amount);
}

/**
 * Get suggested tip amounts for display
 */
export function getSuggestedTips(
  baseTotal: number,
  suggestions: number[],
  tipType: 'percentage' | 'dollar'
): Array<{ suggestion: number; displayAmount: string; displayLabel: string }> {
  return suggestions.map((suggestion) => {
    const tipAmount = calculateTipAmount(baseTotal, suggestion, tipType);
    return {
      suggestion,
      displayAmount: formatCurrency(tipAmount),
      displayLabel: tipType === 'percentage' ? `${suggestion}%` : formatCurrency(suggestion),
    };
  });
}
