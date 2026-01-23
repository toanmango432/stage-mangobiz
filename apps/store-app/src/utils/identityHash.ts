/**
 * Identity Hashing Utilities
 *
 * Provides secure hashing for phone numbers and emails used in cross-store
 * client identity matching (Mango Ecosystem).
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

/**
 * Normalizes a phone number for consistent hashing
 * - Strips all formatting (spaces, dashes, parens)
 * - Extracts last 10 digits
 * - Adds +1 country code
 *
 * Examples:
 * - "+1 (555) 123-4567" → "+15551234567"
 * - "555.123.4567" → "+15551234567"
 * - "1-555-123-4567" → "+15551234567"
 *
 * @param phone - Phone number in any format
 * @returns Normalized phone number with +1 prefix
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Extract last 10 digits (handles cases with or without country code)
  const last10 = digits.slice(-10);

  // Add +1 country code
  return `+1${last10}`;
}

/**
 * Normalizes an email address for consistent hashing
 * - Converts to lowercase
 * - Trims whitespace
 *
 * Examples:
 * - "Test@Email.com" → "test@email.com"
 * - "  USER@EXAMPLE.COM  " → "user@example.com"
 *
 * @param email - Email address in any format
 * @returns Normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Hashes an identifier using SHA-256
 * - Combines value with salt before hashing
 * - Uses Web Crypto API for browser compatibility
 *
 * @param value - The normalized value to hash
 * @param salt - Salt value (from environment variable)
 * @returns Hex-encoded SHA-256 hash
 */
export async function hashIdentifier(value: string, salt: string): Promise<string> {
  // Combine value with salt
  const toHash = `${value}${salt}`;

  // Encode to UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(toHash);

  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes a phone number for ecosystem lookup
 * - Normalizes phone number first
 * - Uses VITE_ECOSYSTEM_SALT from environment
 *
 * @param phone - Phone number in any format
 * @returns SHA-256 hash of normalized phone
 * @throws Error if VITE_ECOSYSTEM_SALT is not configured
 */
export async function hashPhone(phone: string): Promise<string> {
  const salt = import.meta.env.VITE_ECOSYSTEM_SALT;

  if (!salt) {
    throw new Error('VITE_ECOSYSTEM_SALT environment variable is not configured');
  }

  const normalized = normalizePhone(phone);
  return hashIdentifier(normalized, salt);
}

/**
 * Hashes an email address for ecosystem lookup
 * - Normalizes email first
 * - Uses VITE_ECOSYSTEM_SALT from environment
 *
 * @param email - Email address in any format
 * @returns SHA-256 hash of normalized email
 * @throws Error if VITE_ECOSYSTEM_SALT is not configured
 */
export async function hashEmail(email: string): Promise<string> {
  const salt = import.meta.env.VITE_ECOSYSTEM_SALT;

  if (!salt) {
    throw new Error('VITE_ECOSYSTEM_SALT environment variable is not configured');
  }

  const normalized = normalizeEmail(email);
  return hashIdentifier(normalized, salt);
}
