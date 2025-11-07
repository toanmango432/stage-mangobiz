/**
 * Phone number formatting utilities
 * Used across multiple components for consistent phone number handling
 */

/**
 * Format a phone number to (xxx) xxx-xxxx format
 * @param value - Raw phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(value: string | number | null | undefined): string {
  // Handle null, undefined, and number inputs
  if (value == null) return '';
  const stringValue = typeof value === 'number' ? value.toString() : value;

  // Remove all non-digit characters
  let cleaned = stringValue.replace(/\D/g, '');

  // If we have 11 digits and it starts with 1 (US country code), remove it
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = cleaned.substring(1);
  }

  // Apply formatting based on length
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

  if (!match) return stringValue;

  const [, area, prefix, suffix] = match;

  if (!area) return '';
  if (!prefix) return area;
  if (!suffix) return `(${area}) ${prefix}`;

  return `(${area}) ${prefix}-${suffix}`;
}

/**
 * Clean phone number - remove all formatting
 * @param value - Formatted phone number
 * @returns Cleaned phone number (digits only)
 */
export function cleanPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validate phone number
 * @param value - Phone number to validate
 * @returns True if valid US phone number
 */
export function isValidPhoneNumber(value: string): boolean {
  const cleaned = cleanPhoneNumber(value);
  // US phone numbers should be exactly 10 digits
  return cleaned.length === 10;
}

/**
 * Format phone for display (with fallback for incomplete numbers)
 * @param value - Raw phone number
 * @returns Formatted or partially formatted phone number
 */
export function formatPhoneDisplay(value: string): string {
  const cleaned = cleanPhoneNumber(value);

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }

  return formatPhoneNumber(value);
}

/**
 * Parse phone number for international format
 * @param value - Phone number
 * @param countryCode - Country code (default: +1 for US)
 * @returns International format phone number
 */
export function formatInternationalPhone(value: string, countryCode: string = '+1'): string {
  const cleaned = cleanPhoneNumber(value);

  if (cleaned.length !== 10) return value;

  return `${countryCode} ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

/**
 * Phone number input handler for controlled components
 * @param event - Input change event
 * @returns Formatted phone number
 */
export function handlePhoneInput(event: React.ChangeEvent<HTMLInputElement>): string {
  const input = event.target.value;
  const cleaned = cleanPhoneNumber(input);

  // Limit to 10 digits
  if (cleaned.length > 10) {
    return formatPhoneNumber(cleaned.slice(0, 10));
  }

  return formatPhoneNumber(cleaned);
}