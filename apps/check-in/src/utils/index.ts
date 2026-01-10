/**
 * Utility Functions
 *
 * Common helper functions used across the Check-In app.
 */

/**
 * Formats a 10-digit phone number for display
 * @param digits - Raw digits (e.g., "5551234567")
 * @returns Formatted phone (e.g., "(555) 123-4567")
 */
export function formatPhone(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').slice(0, 10);
  if (!cleaned) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Formats a phone number with dashes only (for keypad display)
 * @param digits - Raw digits (e.g., "5551234567")
 * @returns Formatted phone (e.g., "555-123-4567")
 */
export function formatPhoneSimple(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Validates a US phone number format
 * @param phone - Phone number string
 * @returns true if valid 10-digit US phone
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

/**
 * Validates email format
 * @param email - Email string
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates a unique check-in number in format A001, A002, etc.
 * @param currentCount - Current count of check-ins today
 * @returns Check-in number string
 */
export function generateCheckInNumber(currentCount: number): string {
  const letter = 'A'; // Could rotate A-Z based on day/time
  const number = String(currentCount + 1).padStart(3, '0');
  return `${letter}${number}`;
}

/**
 * Gets appropriate greeting based on time of day
 * @returns Greeting string
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Calculates total price from selected services
 * @param services - Array of selected services
 * @returns Total price
 */
export function calculateTotalPrice(services: { price: number }[]): number {
  return services.reduce((sum, s) => sum + s.price, 0);
}

/**
 * Calculates total duration from selected services
 * @param services - Array of selected services
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(services: { durationMinutes: number }[]): number {
  return services.reduce((sum, s) => sum + s.durationMinutes, 0);
}

/**
 * Formats duration in minutes to human readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Formats price to currency string
 * @param price - Price in dollars
 * @returns Formatted price (e.g., "$25.00")
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Generates a UUID v4
 * @returns UUID string
 */
export function generateId(): string {
  return crypto.randomUUID();
}
