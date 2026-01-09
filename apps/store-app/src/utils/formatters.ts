/**
 * Shared Formatters Utility
 *
 * Common formatting functions used across the app
 */

/**
 * Format currency amount
 * @param amount - Amount in dollars
 * @returns Formatted currency (e.g., "$45.00")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format compact currency (e.g., "$1.2K")
 * @param amount - Amount in dollars
 * @returns Formatted currency with compact notation
 */
export const formatCurrencyCompact = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short',
  }).format(amount);
};

/**
 * Format number with commas
 * @param value - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format percentage
 * @param value - Value between 0 and 1 (or 0-100 if isWholeNumber true)
 * @param isWholeNumber - If true, value is already a percentage (0-100)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, isWholeNumber = false): string => {
  const pct = isWholeNumber ? value : value * 100;
  return `${Math.round(pct)}%`;
};

/**
 * Format phone number
 * @param phone - Phone number string
 * @returns Formatted phone (e.g., "(555) 123-4567")
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
